from __future__ import annotations

import hashlib
import ipaddress
import imghdr
import io
import socket
import struct
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse
from urllib.error import HTTPError
from urllib.parse import urljoin
from urllib.request import HTTPRedirectHandler, Request, build_opener

from fastapi import HTTPException, UploadFile, status

from packages.core.config import settings

_ALLOWED_MIME_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

_ALLOWED_KINDS = {"jpeg", "png", "webp"}
_ALLOWED_PORTS = {80, 443}
_MAX_REDIRECTS = 3


class _NoRedirectHandler(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):  # type: ignore[override]
        return None


class StoredMedia:
    def __init__(
        self,
        *,
        storage_path: str,
        mime_type: str,
        file_size_bytes: int,
        checksum_sha256: str,
        width: int | None,
        height: int | None,
        source_url: str | None,
    ) -> None:
        self.storage_path = storage_path
        self.mime_type = mime_type
        self.file_size_bytes = file_size_bytes
        self.checksum_sha256 = checksum_sha256
        self.width = width
        self.height = height
        self.source_url = source_url


class MediaStorageService:
    def __init__(self) -> None:
        self._base_dir = Path(settings.media_storage_dir_resolved).resolve()
        self._public_prefix = settings.media_public_prefix.rstrip("/")
        self._max_upload_bytes = settings.media_max_upload_bytes

    @property
    def base_dir(self) -> Path:
        self._base_dir.mkdir(parents=True, exist_ok=True)
        return self._base_dir

    def _public_path(self, relative: Path) -> str:
        unix = "/".join(relative.parts)
        return f"{self._public_prefix}/{unix}"

    def _sniff_mime(self, data: bytes, declared: str | None) -> str:
        kind = imghdr.what(None, h=data)
        if kind in _ALLOWED_KINDS:
            if kind == "jpeg":
                return "image/jpeg"
            return f"image/{kind}"

        if declared in _ALLOWED_MIME_TYPES:
            return declared

        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported image type. Allowed: jpeg, png, webp",
        )

    def _dimensions(self, data: bytes, mime_type: str) -> tuple[int | None, int | None]:
        try:
            if mime_type == "image/png" and len(data) >= 24:
                width, height = struct.unpack(">II", data[16:24])
                return int(width), int(height)

            if mime_type == "image/jpeg":
                stream = io.BytesIO(data)
                stream.read(2)  # SOI
                while True:
                    marker = stream.read(1)
                    if not marker:
                        break
                    if marker != b"\xFF":
                        continue
                    while marker == b"\xFF":
                        marker = stream.read(1)
                    if marker in {b"\xC0", b"\xC1", b"\xC2", b"\xC3"}:
                        stream.read(3)
                        h, w = struct.unpack(">HH", stream.read(4))
                        return int(w), int(h)
                    seg_len_bytes = stream.read(2)
                    if len(seg_len_bytes) != 2:
                        break
                    seg_len = struct.unpack(">H", seg_len_bytes)[0]
                    stream.seek(seg_len - 2, io.SEEK_CUR)

            if mime_type == "image/webp" and len(data) >= 30:
                if data[12:16] == b"VP8 ":
                    width = struct.unpack("<H", data[26:28])[0] & 0x3FFF
                    height = struct.unpack("<H", data[28:30])[0] & 0x3FFF
                    return int(width), int(height)
        except Exception:
            return None, None

        return None, None

    def _safe_filename(self, checksum: str, ext: str) -> str:
        stamp = datetime.utcnow().strftime("%Y%m%d")
        return f"{stamp}_{checksum[:16]}{ext}"

    def _raise_blocked_host(self) -> None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Source URL host is not allowed",
        )

    def _validate_url_target(self, url: str) -> tuple[str, int]:
        parsed = urlparse(url)
        if parsed.scheme not in {"http", "https"}:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="URL must be http/https",
            )

        if not parsed.hostname:
            self._raise_blocked_host()

        host = parsed.hostname.strip().lower().rstrip(".")
        if host == "localhost" or host.endswith(".localhost"):
            self._raise_blocked_host()

        port = parsed.port or (443 if parsed.scheme == "https" else 80)
        if port not in _ALLOWED_PORTS:
            self._raise_blocked_host()

        try:
            addr_info = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
        except Exception:
            self._raise_blocked_host()

        seen_ips: set[str] = set()
        for entry in addr_info:
            sockaddr = entry[4]
            if not sockaddr:
                continue
            ip_raw = str(sockaddr[0])
            if ip_raw in seen_ips:
                continue
            seen_ips.add(ip_raw)
            try:
                ip = ipaddress.ip_address(ip_raw)
            except ValueError:
                self._raise_blocked_host()

            if (
                ip.is_loopback
                or ip.is_private
                or ip.is_link_local
                or ip.is_multicast
                or ip.is_unspecified
                or ip.is_reserved
                or not ip.is_global
            ):
                self._raise_blocked_host()

        if not seen_ips:
            self._raise_blocked_host()

        return host, port

    def _fetch_with_policy(self, source_url: str) -> tuple[bytes, str | None, str]:
        opener = build_opener(_NoRedirectHandler())
        current_url = source_url

        for _ in range(_MAX_REDIRECTS + 1):
            self._validate_url_target(current_url)
            req = Request(url=current_url, method="GET", headers={"User-Agent": "flowbiz-media-library/1.0"})
            try:
                with opener.open(req, timeout=20) as response:
                    body = response.read(self._max_upload_bytes + 1)
                    content_type = response.headers.get("Content-Type", "").split(";")[0].strip() or None
                    return body, content_type, current_url
            except HTTPError as exc:
                if 300 <= exc.code < 400:
                    location = exc.headers.get("Location") if exc.headers else None
                    if not location:
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Unable to fetch source URL",
                        ) from exc
                    current_url = urljoin(current_url, location)
                    continue

                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Unable to fetch source URL",
                ) from exc
            except HTTPException:
                raise
            except Exception as exc:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Unable to fetch source URL",
                ) from exc

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Too many redirects for source URL",
        )

    def store_upload(self, file: UploadFile) -> StoredMedia:
        raw = file.file.read(self._max_upload_bytes + 1)
        if len(raw) == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty upload")
        if len(raw) > self._max_upload_bytes:
            raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File too large")

        mime_type = self._sniff_mime(raw, file.content_type)
        ext = _ALLOWED_MIME_TYPES[mime_type]
        checksum = hashlib.sha256(raw).hexdigest()
        width, height = self._dimensions(raw, mime_type)

        relative_dir = Path("library") / datetime.utcnow().strftime("%Y") / datetime.utcnow().strftime("%m")
        target_dir = self.base_dir / relative_dir
        target_dir.mkdir(parents=True, exist_ok=True)

        filename = self._safe_filename(checksum, ext)
        target_file = target_dir / filename
        if not target_file.exists():
            target_file.write_bytes(raw)

        return StoredMedia(
            storage_path=self._public_path(relative_dir / filename),
            mime_type=mime_type,
            file_size_bytes=len(raw),
            checksum_sha256=checksum,
            width=width,
            height=height,
            source_url=None,
        )

    def ingest_from_url(self, url: str) -> StoredMedia:
        body, content_type, final_url = self._fetch_with_policy(url)

        if len(body) == 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Source URL returned empty body")
        if len(body) > self._max_upload_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Source file too large",
            )

        mime_type = self._sniff_mime(body, content_type)
        ext = _ALLOWED_MIME_TYPES[mime_type]
        checksum = hashlib.sha256(body).hexdigest()
        width, height = self._dimensions(body, mime_type)

        relative_dir = Path("library") / datetime.utcnow().strftime("%Y") / datetime.utcnow().strftime("%m")
        target_dir = self.base_dir / relative_dir
        target_dir.mkdir(parents=True, exist_ok=True)

        filename = self._safe_filename(checksum, ext)
        target_file = target_dir / filename
        if not target_file.exists():
            target_file.write_bytes(body)

        return StoredMedia(
            storage_path=self._public_path(relative_dir / filename),
            mime_type=mime_type,
            file_size_bytes=len(body),
            checksum_sha256=checksum,
            width=width,
            height=height,
            source_url=final_url,
        )


def parse_source_domain(source_url: str | None) -> str | None:
    if not source_url:
        return None
    try:
        host = urlparse(source_url).hostname
    except Exception:
        return None
    return host.lower() if host else None
