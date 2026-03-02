import { redirect } from 'next/navigation';

export default function RentRedirect() {
  redirect('/public/properties?type=rent');
}
