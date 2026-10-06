---
name: fast-track
description: Use only when the user explicitly invokes /fast-track or $fast-track for a repository task. Invocation explicitly authorizes staging, committing, repeatedly synchronizing with origin/main, resolving clear conflicts, and non-forced pushing directly to origin/main without another confirmation.
---

# Fast Track

Complete the requested task with a deliberately lightweight delivery path.

Invoking this skill is the user's explicit authorization to stage the
task-owned files, create one commit, rebase it onto an advanced `origin/main`
when needed, and push that commit directly to `origin/main`. Do not ask the
user for a separate staging, commit, rebase, branch, or push confirmation in
chat. If an execution tool requires an approval request, state that the user
already authorized this exact direct-to-main workflow by invoking
`/fast-track`.

## Workflow

1. Inspect the repository instructions and initial Git status. Preserve all
   unrelated and pre-existing changes.
2. Implement only the requested change. Prefer the smallest clear solution and
   avoid optional refactors or scope expansion.
3. Keep verification proportional and brief:
   - Skip writing new tests unless the change is risky or cannot be checked
     adequately another way.
   - Run only the smallest relevant existing check when it adds meaningful
     confidence.
   - Do not spend substantial time testing through the real UI. Skip UI testing
     when the change is simple enough or does not affect visible behavior.
   - Never claim a skipped check passed; state what was intentionally omitted.
4. Stage only task-owned files and create one new commit on `main` with a concise
   message. Push that commit directly to `origin/main` without opening a pull
   request or asking for another confirmation.
5. Never force-push. Do not stop merely because `origin/main` advanced or a
   rebase conflict occurred. Fetch the latest remote state, rebase the task
   commit onto it, and resolve conflicts by preserving both the upstream
   changes and the requested task outcome. Re-run the smallest relevant check
   after a conflict resolution, then retry the non-forced push. Repeat this
   synchronization loop whenever `origin/main` advances again, until the push
   succeeds. Stop only when resolving a conflict would require guessing or
   discarding unrelated work, or when remote permissions or branch protection
   make a non-forced direct push impossible; report that concrete blocker.
6. After the commit is safely present on `origin/main`, clean up only artifacts
   created by the task: stop task-started processes, remove task-created
   temporary files, and remove a task-specific linked worktree when applicable.
   Do not discard, stash, reset, or delete pre-existing user work. Finish with a
   clean status for the task's own changes.

Report the commit hash, push result, concise verification performed, checks
intentionally skipped, and any pre-existing changes left in place.
