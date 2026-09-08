Repo sync helper

Purpose:
- Automatically create a branch and PR in the mirror repository whenever main/master receives commits.

Configuration:
- Add repository secret:
  - external-aura: SYNC_TO_UGTOPUP_TOKEN (PAT that can push/create PRs in aiagentra-ctrl/ugtopup)
  - ugtopup: SYNC_TO_EXTERNAL_AURA_TOKEN (PAT that can push/create PRs in aiagentra-ctrl/external-aura)

Notes:
- The workflow skips commits containing "[repo-sync]" to help prevent loops.
- Created branch: sync/from-<source>-<sha>.
- Merge the PR in the target repo to apply the synchronized changes.