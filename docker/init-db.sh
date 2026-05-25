#!/bin/bash
set -e
psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"device-manager\";"
grep -v '^\\restrict' /dump/backup-dm-dev.sql | psql -U "$POSTGRES_USER" -d "device-manager"
