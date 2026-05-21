import { ClientForm } from '@/components/clients/client-form'

export const metadata = {
  title: 'Novo Cliente | Trax',
}

export default function NewClientPage() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ClientForm />
    </div>
  )
}
