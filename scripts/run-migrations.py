#!/usr/bin/env python3
import subprocess
import os
import sys

# Get the directory where the script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)

print(f"[v0] Project root: {project_root}")
print(f"[v0] Current directory: {os.getcwd()}")
print(f"[v0] DATABASE_URL is set: {bool(os.getenv('DATABASE_URL'))}")

# Check if drizzle.config.ts exists
drizzle_config = os.path.join(project_root, "drizzle.config.ts")
print(f"[v0] Checking for drizzle.config.ts at: {drizzle_config}")
print(f"[v0] File exists: {os.path.exists(drizzle_config)}")

# Change to project directory
os.chdir(project_root)
print(f"[v0] Changed to directory: {os.getcwd()}")

try:
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
