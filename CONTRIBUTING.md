# Contributing to UseYourTools

Thank you for your interest in contributing! ✨

## Pull request workflow

We use **branches and pull requests** for changes (including docs and small fixes), not direct commits to `main`.

1. **Branch from latest `main`**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b your-branch-name
   ```
   Use a short, descriptive name, e.g. `docs/update-readme`, `fix/calendar-sync`, `feat/deadline-reminders`.

2. **Make commits** with clear messages (what changed and why).

3. **Push your branch**
   ```bash
   git push -u origin your-branch-name
   ```

4. **Open a PR** on GitHub targeting `main`. Describe the change and link any issue if applicable.

5. **Merge** after review (or when you’re satisfied, if you’re solo).

6. **Clean up**: delete the branch on GitHub after merge; locally: `git checkout main && git pull && git branch -d your-branch-name`.

### Optional: create the PR from the CLI

If you use [GitHub CLI](https://cli.github.com/) (`gh`):

```bash
gh pr create --base main --head your-branch-name --title "Short title" --body "What changed and why."
```

---

## Ideas and roadmap

Future feature ideas are tracked in [`FEATURE_IDEAS.md`](FEATURE_IDEAS.md). Opening an issue or discussing in a PR is welcome before large additions.
