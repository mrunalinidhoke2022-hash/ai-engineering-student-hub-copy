import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const CATEGORIES = ['General AI', 'Coding', 'Research', 'Design', 'Presentations', 'Image Generation', 'Video Generation', 'Audio', 'Writing', 'Productivity', 'Data Science', 'Developer Tools', 'Cloud'];
const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const PRICING = ['Free', 'Freemium', 'Paid'];
const MAX_NEW_TOOLS = 5;
const MAX_UPDATES = 5;

const slugify = (value: unknown) =>
  String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

const clean = (value: unknown, max = 400) => (typeof value === 'string' ? value.trim().slice(0, max) : '');

const listOf = (value: unknown, max: number, maxLength: number) =>
  (Array.isArray(value) ? value : []).map((item) => clean(item, maxLength)).filter(Boolean).slice(0, max);

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Everything already in the directory, so the research step never duplicates it.
    const known: any[] = [];
    let cursor: string | undefined;
    do {
      const page = await base44.asServiceRole.entities.Tool.filter({}, { limit: 200, cursor, fields: ['name', 'slug'] });
      known.push(...page.items);
      cursor = page.has_more ? page.next_cursor : undefined;
    } while (cursor);

    const knownSlugs = new Set(known.map((tool) => String(tool.slug || '').toLowerCase()).filter(Boolean));
    const knownNames = known.map((tool) => String(tool.name || '').trim()).filter(Boolean);
    const knownNamesLower = new Set(knownNames.map((name) => name.toLowerCase()));
    const today = new Date().toISOString().slice(0, 10);

    const prompt = `You keep the "AI Tools Directory" of an engineering-student learning platform current.
Today is ${today}. Search the web (vendor sites, launch announcements, tech news) and report only what changed in the LAST 30 DAYS.

1) NEW TOOLS — AI tools released or publicly launched within the last 30 days that are genuinely useful to engineering students: coding help, research, design, presentations, image/video/audio generation, data science, developer tooling, cloud.
- Only include tools you can confirm from a credible source AND that have their own working official website. official_url must be that product's own homepage on its own domain — never a roundup, directory, aggregator, affiliate or news-article URL. If you cannot find the product's own homepage, leave the tool out.
- Never repeat a tool that is already listed here: ${knownNames.join(', ')}
- Return at most ${MAX_NEW_TOOLS}, ranked by how notable and useful they are. Quality over quantity — return an empty list if nothing solid was found.
- Write plainly for a student, no marketing hype. description is 2 sentences; what_is, why_use, what_can_you_do and how_to_start are 2-3 sentences each; release_note is one line saying what it is and when it launched; tags are 3-4 short lowercase keywords; useful_for is 2-4 study or engineering uses.
- category must be exactly one of: ${CATEGORIES.join(', ')}. level must be one of: ${LEVELS.join(', ')}. pricing must be one of: ${PRICING.join(', ')}.

2) UPDATES — for tools already in the directory (use the exact names from the list above), at most ${MAX_UPDATES} notable changes from the last 30 days: a rename, a major new capability, a new free tier, or a pricing change. One short line per tool explaining what changed and why a student should care. Return an empty list if nothing important happened.`;

    const schema = {
      type: 'object',
      properties: {
        new_tools: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              category: { type: 'string' },
              description: { type: 'string' },
              what_is: { type: 'string' },
              why_use: { type: 'string' },
              what_can_you_do: { type: 'string' },
              how_to_start: { type: 'string' },
              level: { type: 'string' },
              pricing: { type: 'string' },
              official_url: { type: 'string' },
              tags: { type: 'array', items: { type: 'string' } },
              useful_for: { type: 'array', items: { type: 'string' } },
              release_note: { type: 'string' }
            },
            required: ['name', 'category', 'description', 'official_url', 'release_note']
          }
        },
        updates: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              change: { type: 'string' }
            },
            required: ['name', 'change']
          }
        }
      },
      required: ['new_tools', 'updates']
    };

    const research: any = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: schema
    });

    const candidates = Array.isArray(research?.new_tools) ? research.new_tools.slice(0, MAX_NEW_TOOLS) : [];
    const records: any[] = [];
    const notes: { name: string; note: string }[] = [];

    for (const item of candidates) {
      const name = clean(item?.name, 80);
      const slug = slugify(name);
      const officialUrl = clean(item?.official_url, 300);
      if (!slug || !name || knownSlugs.has(slug)) continue;
      if (!/^https?:\/\/[^\s]+\.[^\s]+/i.test(officialUrl)) continue;
      knownSlugs.add(slug);
      records.push({
        name,
        slug,
        category: CATEGORIES.includes(item?.category) ? item.category : 'General AI',
        description: clean(item?.description, 900),
        level: LEVELS.includes(item?.level) ? item.level : 'Beginner',
        pricing: PRICING.includes(item?.pricing) ? item.pricing : 'Freemium',
        official_url: officialUrl,
        tags: listOf(item?.tags, 4, 24),
        useful_for: listOf(item?.useful_for, 4, 40),
        what_is: clean(item?.what_is, 600),
        why_use: clean(item?.why_use, 600),
        what_can_you_do: clean(item?.what_can_you_do, 600),
        how_to_start: clean(item?.how_to_start, 600),
        // Auto-discovered entries stay unverified until an admin reviews them.
        verified: false
      });
      notes.push({ name, note: clean(item?.release_note, 160) });
    }

    if (records.length) {
      await base44.asServiceRole.entities.Tool.bulkCreate(records);
    }

    const updates = (Array.isArray(research?.updates) ? research.updates : [])
      .map((item: any) => ({ name: clean(item?.name, 80), change: clean(item?.change, 220) }))
      .filter((item: any) => item.name && item.change && knownNamesLower.has(item.name.toLowerCase()))
      .slice(0, MAX_UPDATES);

    let announcements = 0;

    if (records.length) {
      const lines = notes.map((entry) => (entry.note ? `• ${entry.name} — ${entry.note}` : `• ${entry.name}`));
      await base44.asServiceRole.entities.Announcement.create({
        title: `${records.length} new AI tool${records.length > 1 ? 's' : ''} added to the directory`,
        message: `${lines.join('\n')}\nOpen AI Tools to explore ${records.length > 1 ? 'them' : 'it'}.`,
        category: 'New Feature',
        link: '/ai-tools'
      });
      announcements += 1;
    }

    if (updates.length) {
      await base44.asServiceRole.entities.Announcement.create({
        title: 'Updates to AI tools you already use',
        message: updates.map((item: any) => `• ${item.name} — ${item.change}`).join('\n'),
        category: 'Site Update',
        link: '/ai-tools'
      });
      announcements += 1;
    }

    return Response.json({
      checked: known.length,
      created: records.length,
      added: records.map((record) => record.name),
      updates: updates.map((item: any) => item.name),
      announcements
    });
  } catch (error) {
    return Response.json({ error: 'Update check failed. Please try again.' }, { status: 500 });
  }
}