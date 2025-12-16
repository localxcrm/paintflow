@echo off
REM Commit script for PaintPro migration changes

echo Setting up Git identity...
git config user.name "Rodrigo Campos"
git config user.email "rodrigo@localxcrm.com"

echo.
echo Committing changes...
git commit -m "fix: Update Supabase client initialization for production builds

- Fixed Supabase client to handle missing env vars during build
- Updated client to use lazy initialization
- Server-side client properly validates environment variables
- Build now completes successfully
- Updated migration documentation to reflect 100%% completion

This resolves build errors when deploying to production environments
where environment variables may not be available during build time.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"

echo.
echo Commit complete! Ready to push to GitHub.
echo Run: git push
pause
