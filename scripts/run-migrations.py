#!/usr/bin/env python3
import subprocess
import os
import sys
import glob

# The working directory when script runs is in /home/user
cwd = os.getcwd()
print(f"[v0] Current working directory: {cwd}")
print(f"[v0] DATABASE_URL is set: {bool(os.getenv('DATABASE_URL'))}")

# Look for drizzle.config.ts in common project locations
possible_locations = [
    "/vercel/share/v0-project",
    "/vercel/share/v0-next-shadcn",
    "/home/user/project",
    "/app",
]

project_root = None
for location in possible_locations:
    config_path = os.path.join(location, "drizzle.config.ts")
    if os.path.exists(config_path):
        project_root = location
        print(f"[v0] Found drizzle.config.ts at: {config_path}")
        break

if not project_root:
    # Search the entire filesystem for drizzle.config.ts
    print("[v0] Searching filesystem for drizzle.config.ts...")
    try:
        results = subprocess.run(
            ["find", "/", "-name", "drizzle.config.ts", "-type", "f"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if results.stdout:
            found_paths = results.stdout.strip().split('\n')
            print(f"[v0] Found drizzle.config.ts at: {found_paths[0]}")
            project_root = os.path.dirname(found_paths[0])
    except:
        pass

if not project_root:
    print("[v0] Could not find drizzle.config.ts anywhere")
    print("[v0] Trying to run from current directory anyway...")
    project_root = cwd

print(f"[v0] Using project root: {project_root}")

try:
    os.chdir(project_root)
    print(f"[v0] Changed to directory: {os.getcwd()}")
    
    # Run drizzle-kit push
    result = subprocess.run(
        ["npx", "drizzle-kit", "push"],
        env={**os.environ, "NODE_ENV": "production"},
        capture_output=False
    )
    
    if result.returncode == 0:
        print("[v0] Database migration completed successfully!")
        sys.exit(0)
    else:
        print(f"[v0] Migration failed with return code: {result.returncode}")
        sys.exit(1)
except Exception as e:
    print(f"[v0] Migration failed: {e}")
    sys.exit(1)


