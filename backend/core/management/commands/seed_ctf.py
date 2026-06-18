import random

from django.core.management.base import BaseCommand
from django.core.cache import cache
from django.db import connection
from faker import Faker

from core.flags import runtime_value

fake = Faker()

SEED_POSTS = [
    "Pushed the gateway hotfix. Rotate any tokens issued before 14:00.",
    "Reminder: incident review at 15:00. Bring timelines, not excuses.",
    "PSA: stop committing creds to the repo. You know who you are.",
    "Perimeter scan flagged an open port nobody claims. Filing it.",
    "Whoever defaced the status page earlier: cute. It's reverted.",
    "Read-only access is a privilege, not a right. Don't push it.",
    "On-call handoff is in the channel. Quiet shift, no escalations.",
]


class Command(BaseCommand):
    help = 'Seed the database with operators and dispatches.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Clear dispatches/comments but keep operators and flags.',
        )

    def handle(self, *args, **options):
        from accounts.models import Identity, Solve
        from feed.models import Post, Comment
        from search.models import KV

        self._install_directory_plan()

        if options['flush']:
            self.stdout.write('Flushing dispatches, comments, solves...')
            Comment.objects.all().delete()
            Post.objects.all().delete()
            Solve.objects.all().delete()
            Identity.objects.all().update(points=0)
            # Demote every escalated account so only the overseer is admin after a
            # reset; players re-earn admin by redoing M2. Also clears staff_note.
            Identity.objects.exclude(handle='overseer').update(role='user', staff_note='')
            cache.delete('grimoire:banner')
            cache.delete('grimoire:breach')
            self.stdout.write(self.style.SUCCESS('Flush complete.'))
            self._seed_posts()
            return

        self.stdout.write('Seeding CTF data...')

        # Overseer (admin). is_npc stays False so it shows on the board as [ADMIN];
        # points start at 0 (it isn't competing).
        overseer, _ = Identity.objects.get_or_create(
            handle='overseer',
            defaults={
                'role': 'admin',
                'bio': '<em>Overseer.</em> Every dispatch crosses my desk.',
                'points': 0,
            },
        )

        # A small set of feed-author NPCs (is_npc=True hides them from the leaderboard).
        # Idempotent: only fill the deficit. Real participants populate the rest live.
        existing = Identity.objects.filter(is_npc=True).count()
        for _ in range(max(0, 8 - existing)):
            handle = fake.user_name() + str(fake.random_int(10, 999))
            while Identity.objects.filter(handle=handle).exists():
                handle = fake.user_name() + str(fake.random_int(10, 999))
            Identity.objects.create(
                handle=handle,
                points=0,
                bio=fake.sentence(),
                is_npc=True,
            )

        self._seed_posts()

        KV.objects.get_or_create(
            label='catalog_rev',
            defaults={'value': runtime_value('e0d53')},
        )

        self.stdout.write(self.style.SUCCESS('Seed complete.'))

    def _seed_posts(self):
        from accounts.models import Identity
        from feed.models import Post, Comment

        identities = list(Identity.objects.exclude(handle='overseer'))

        if not identities:
            return

        if not Post.objects.exists():
            for body in SEED_POSTS:
                author = random.choice(identities)
                Post.objects.create(author=author, body_raw=body, body_html=f'<p>{body}</p>')

            for post in list(Post.objects.all()[:3]):
                Comment.objects.create(
                    post=post,
                    author=random.choice(identities),
                    body=fake.sentence(),
                )

    def _install_directory_plan(self):
        with connection.cursor() as cur:
            cur.execute("""
                CREATE OR REPLACE FUNCTION identity_lookup(term text, order_key text DEFAULT 'handle')
                RETURNS TABLE(id bigint, handle varchar, bio text)
                LANGUAGE plpgsql
                AS $$
                DECLARE
                    order_expr text := CASE order_key
                        WHEN 'id' THEN 'id'
                        WHEN 'points' THEN 'points'
                        ELSE 'handle'
                    END;
                    clean_term text := replace(replace(replace(replace(term, '--', ''), ';', ''), '/*', ''), '*/', '');
                    stmt text;
                BEGIN
                    stmt := 'SELECT id, handle, bio FROM accounts_identity ' ||
                        'WHERE (handle || '' '' || bio) ILIKE ''%' || clean_term || '%'' ' ||
                        'ORDER BY ' || order_expr;
                    RETURN QUERY EXECUTE stmt;
                END;
                $$;
            """)
