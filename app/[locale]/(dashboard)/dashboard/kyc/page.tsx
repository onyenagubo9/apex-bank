import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getKycStatus } from '@/actions/kyc';
import KycClient from '@/components/kyc/KycClient';

export default async function KycPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Fetch current KYC status for the logged-in user 📥
  const { kyc = null } = await getKycStatus(session.user.id);

  return (
    <KycClient 
      userId={session.user.id} 
      initialKyc={kyc} 
    />
  );
}