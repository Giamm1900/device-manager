#!/bin/bash
set -e
pg_restore --clean --create --if-exists -U "$POSTGRES_USER" -d postgres /dump/backup-dm-dev
