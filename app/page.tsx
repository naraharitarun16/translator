import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getMessages } from '@/app/actions/messages'
import { Inbox } from '@/components/inbox'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')
  const messages = await getMessages()
  const userName = (user.user_metadata as { name?: string })?.name || user.email || 'User'
  return <Inbox messages={messages} userName={userName} />
}
