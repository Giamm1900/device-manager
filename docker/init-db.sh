#!/bin/bash
set -e
psql -U "$POSTGRES_USER" -d postgres -c "CREATE DATABASE \"Industrial-Telemetry-Dashboard\";"
grep -v '^\\restrict' /dump/backup-dm-dev.sql | psql -U "$POSTGRES_USER" -d "Industrial-Telemetry-Dashboard"
