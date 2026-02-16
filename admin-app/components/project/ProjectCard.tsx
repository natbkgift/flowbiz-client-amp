export function ProjectCard({ name, count }: { name: string; count: number }) {
  return (
    <div className="property-card" style={{ padding: 0 }}>
      <div className="card-content">
        <div className="card-title">{name}</div>
        <div className="card-location" style={{ marginBottom: 0 }}>
          {count} listings
        </div>
      </div>
    </div>
  );
}
