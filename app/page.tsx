import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getMessages } from '@/app/actions/messages'
import { Inbox } from '@/components/inbox'

export default async function Page() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) redirect('/sign-in')
  const messages = await getMessages()
  return <Inbox messages={messages} userName={session.user.name} />
}
