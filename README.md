# Issue Labeler
This action automatically add "done" label to issues when related PR is merged.

## PR Description
To trigger this action, at least one line in PR description should match following regex:

```regex
/^bug:\s*((#\d+)[,\s]*)+$/
```

## Tips
If the PR contributes to a bug, but does not fully resolve it, add any none whitespace content to prevent match. E.g.
```
bug: #1234 in progress
```

or
```
bug: #1234 WIP
```
