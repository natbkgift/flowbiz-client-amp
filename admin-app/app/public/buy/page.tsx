import { redirect } from 'next/navigation';

export default function BuyRedirect() {
  redirect('/public/properties?type=resale');
}
