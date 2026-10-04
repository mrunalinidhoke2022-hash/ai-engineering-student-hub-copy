import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { serverError } from '../../shared/http.ts';
import {
  sanitizeAchievement,
  sanitizeChallenge,
  sanitizeLanguage,
  sanitizeLesson,
  sanitizeSolution,
  text
} from '../../shared/questContent.ts';

const badRequest = (message: string) => Response.json({ error: message }, { status: 400 });

const languageExists = async (base44: any, slug: string) => {
  if (!slug) return false;
  const page = await base44.entities.ProgrammingLanguage.filter({ slug }, { limit: 1 });
  return Boolean(page.items?.[0]);
};

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admins only' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = text(body?.action, 40);

    if (action === 'language.save') {
      const payload = sanitizeLanguage(body?.language);
      if (!payload.name || !payload.slug) return badRequest('A language name is required');
      const duplicate = await base44.entities.ProgrammingLanguage.filter({ slug: payload.slug }, { limit: 5 });
      const clash = duplicate.items?.find((item: any) => item.id !== body?.language?.id);
      if (clash) return badRequest('Another language already uses that slug');
      const saved = body?.language?.id
        ? await base44.entities.ProgrammingLanguage.update(body.language.id, payload)
        : await base44.entities.ProgrammingLanguage.create(payload);
      return Response.json({ saved });
    }

    if (action === 'language.delete') {
      const id = text(body?.id, 60);
      const language = id ? await base44.entities.ProgrammingLanguage.get(id).catch(() => null) : null;
      if (!language) return badRequest('Language not found');
      const [lessons, challenges] = await Promise.all([
        base44.entities.Lesson.count({ language_slug: language.slug }),
        base44.entities.CodingChallenge.count({ language_slug: language.slug })
      ]);
      if (lessons > 0 || challenges > 0) {
        return badRequest('Remove this language\u2019s lessons and challenges first');
      }
      await base44.entities.ProgrammingLanguage.delete(id);
      return Response.json({ deleted: true });
    }

    if (action === 'lesson.save') {
      const payload = sanitizeLesson(body?.lesson);
      if (!payload.title) return badRequest('A lesson title is required');
      if (!(await languageExists(base44, payload.language_slug))) return badRequest('Add the language first');
      const saved = body?.lesson?.id
        ? await base44.entities.Lesson.update(body.lesson.id, payload)
        : await base44.entities.Lesson.create(payload);
      return Response.json({ saved });
    }

    if (action === 'lesson.delete') {
      const id = text(body?.id, 60);
      if (!id) return badRequest('Lesson is required');
      await base44.entities.Lesson.delete(id);
      return Response.json({ deleted: true });
    }

    if (action === 'challenge.save') {
      const payload = sanitizeChallenge(body?.challenge);
      if (!payload.title || !payload.problem) return badRequest('A title and problem statement are required');
      if (!(await languageExists(base44, payload.language_slug))) return badRequest('Add the language first');

      const saved = body?.challenge?.id
        ? await base44.entities.CodingChallenge.update(body.challenge.id, payload)
        : await base44.entities.CodingChallenge.create(payload);

      const solution = sanitizeSolution(body?.solution);
      const existing = await base44.entities.ChallengeSolution.filter({ challenge_id: saved.id }, { limit: 1 });
      if (existing.items?.[0]) {
        await base44.entities.ChallengeSolution.update(existing.items[0].id, { challenge_id: saved.id, ...solution });
      } else {
        await base44.entities.ChallengeSolution.create({ challenge_id: saved.id, ...solution });
      }
      return Response.json({ saved });
    }

    if (action === 'challenge.delete') {
      const id = text(body?.id, 60);
      if (!id) return badRequest('Challenge is required');
      await base44.entities.CodingChallenge.delete(id);
      await base44.entities.ChallengeSolution.deleteMany({ challenge_id: id });
      return Response.json({ deleted: true });
    }

    if (action === 'achievement.save') {
      const payload = sanitizeAchievement(body?.achievement);
      if (!payload.name || !payload.key) return badRequest('A badge name is required');
      const duplicate = await base44.entities.Achievement.filter({ key: payload.key }, { limit: 5 });
      const clash = duplicate.items?.find((item: any) => item.id !== body?.achievement?.id);
      if (clash) return badRequest('Another badge already uses that key');
      const saved = body?.achievement?.id
        ? await base44.entities.Achievement.update(body.achievement.id, payload)
        : await base44.entities.Achievement.create(payload);
      return Response.json({ saved });
    }

    if (action === 'achievement.delete') {
      const id = text(body?.id, 60);
      if (!id) return badRequest('Badge is required');
      await base44.entities.Achievement.delete(id);
      return Response.json({ deleted: true });
    }

    return badRequest('Unknown action');
  } catch (error) {
    return serverError(error);
  }
}