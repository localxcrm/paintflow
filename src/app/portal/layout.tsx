import { Toaster } from 'sonner';

export const metadata = {
  title: 'Portal do Cliente - PaintFlow',
  description: 'Acompanhe o status do seu trabalho',
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Toaster position="top-center" richColors />
      {children}
    </div>
  );
}
