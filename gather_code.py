import os
import re

# Directories to search
ROOT_DIR = r"d:\anumolproject\ChemConceptBridge"
BACKEND_DIR = os.path.join(ROOT_DIR, "backend")
FRONTEND_SRC_DIR = os.path.join(ROOT_DIR, "frontend", "src")
FRONTEND_PUBLIC_DIR = os.path.join(ROOT_DIR, "frontend", "public")

# Extensions to include
EXTENSIONS = (".js", ".jsx", ".css", ".html")

# Files/Folders to exclude
EXCLUDE_DIRS = {"node_modules", ".git", "build", "dist", ".zenflow", ".zencoder", "tests"}
EXCLUDE_FILES = {".env", "package-lock.json", ".gitignore"}

# Output file
OUTPUT_FILE = r"C:\Users\LENOVO\.gemini\antigravity\brain\995fe2e6-1f1f-45d5-a7b1-01c42c76d04c\copyright_source_code.md"

def is_excluded(path):
    parts = path.split(os.sep)
    for part in parts:
        if part in EXCLUDE_DIRS:
            return True
    if os.path.basename(path) in EXCLUDE_FILES:
        return True
    return False

def gather_code():
    with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
        out.write("# ChemConcept Bridge - Source Code for Copyright Registration\n\n")
        out.write("This document contains the source code for the ChemConcept Bridge project, excluding all credentials and third-party libraries.\n\n")
        
        for root, dirs, files in os.walk(ROOT_DIR):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            
            if is_excluded(root):
                continue
            
            for file in files:
                if file.endswith(EXTENSIONS) and not is_excluded(os.path.join(root, file)):
                    full_path = os.path.join(root, file)
                    rel_path = os.path.relpath(full_path, ROOT_DIR)
                    
                    out.write(f"## File: {rel_path}\n\n")
                    out.write("```" + (file.split(".")[-1] if "." in file else "") + "\n")
                    
                    try:
                        with open(full_path, "r", encoding="utf-8") as f:
                            content = f.read()
                            # Basic sanitization for potential secrets if any were missed
                            content = re.sub(r"MONGO_URI=.*", "MONGO_URI=[REDACTED]", content)
                            content = re.sub(r"JWT_SECRET=.*", "JWT_SECRET=[REDACTED]", content)
                            out.write(content)
                    except Exception as e:
                        out.write(f"// Error reading file: {str(e)}\n")
                    
                    out.write("\n```\n\n")

if __name__ == "__main__":
    gather_code()
    print(f"Source code gathered in: {OUTPUT_FILE}")
