import { StudyTopic, TopicStatus } from './db'

/** Un toque en el estado avanza al siguiente: pendiente → en curso → dominado → pendiente. */
const NEXT: Record<TopicStatus, TopicStatus> = { pending: 'in_progress', in_progress: 'mastered', mastered: 'pending' }

/** Cambios al avanzar un tema; `mastered_at` guarda cuándo se dominó, para la revisión semanal. */
export const advanceTopic = (topic: StudyTopic): Pick<StudyTopic, 'status' | 'mastered_at'> => {
  const status = NEXT[topic.status]
  return { status, mastered_at: status === 'mastered' ? new Date().toISOString() : null }
}
