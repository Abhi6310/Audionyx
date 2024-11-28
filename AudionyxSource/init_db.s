#!/bin/bash

# DO NOT PUSH THIS FILE TO GITHUB
# This file contains sensitive information and should be kept private

# TODO: Set your PostgreSQL URI - Use the External Database URL from the Render dashboard
PG_URI="postgresql://audionyx:8iTzVHptZfbcxqNbHwJI4BtOT7AOdIvt@dpg-csvrfl3tq21c73au3olg-a.oregon-postgres.render.com/users_db_46a2"

# Execute each .sql file in the directory
for file in init_data/*.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done