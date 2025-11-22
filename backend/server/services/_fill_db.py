import psycopg2

def fill_db(db_connection: psycopg2.extensions.connection, projects: list[dict]) -> int:
    cur = db_connection.cursor()
    for project in projects:
        uuid = project.get("uuid")
        slug = project.get("slug")
        name = project.get("name")
        tagline = project.get("tagline", "")
        description = project.get("description", "")
        how_its_made = project.get("howItsMade", "")
        source_code_url = project.get("sourceCodeUrl") or ""
        event_name = project.get("event", {}).get("name", "")
        logo_url = project.get("logo", {}).get("file", {}).get("fullUrl", "")
        banner_url = project.get("banner", {}).get("file", {}).get("fullUrl", "")
        
        # Insert or update project
        cur.execute("""
            INSERT INTO project (uuid, slug, name, tagline, description, how_its_made, 
                                source_code_url, event_name, logo_url, banner_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (uuid) DO UPDATE
            SET slug = EXCLUDED.slug,
                name = EXCLUDED.name,
                tagline = EXCLUDED.tagline,
                description = EXCLUDED.description,
                how_its_made = EXCLUDED.how_its_made,
                source_code_url = EXCLUDED.source_code_url,
                event_name = EXCLUDED.event_name,
                logo_url = EXCLUDED.logo_url,
                banner_url = EXCLUDED.banner_url
        """, (uuid, slug, name, tagline, description, how_its_made, 
            source_code_url, event_name, logo_url, banner_url))
        
        # Insert prizes
        prizes = project.get("prizes", [])
        for prize in prizes:
            detail = prize.get("name", "")
            prize_data = prize.get("prize", {})
            
            if prize_data:
                name = prize_data.get("name", "") or ""
                emoji = prize_data.get("emoji", "") or ""
                prize_type = prize_data.get("type", "") or ""
                sponsor = prize_data.get("sponsor", {}).get("name", "") or ""
                sponsor_org = prize_data.get("sponsor", {}).get("organization", {}).get("name", "") or ""
                
                cur.execute("""
                    INSERT INTO prize (project_uuid, name, detail, emoji, type, sponsor, sponsor_organization)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (detail) DO UPDATE
                    SET name = EXCLUDED.name,
                        emoji = EXCLUDED.emoji,
                        type = EXCLUDED.type,
                        sponsor = EXCLUDED.sponsor,
                        sponsor_organization = EXCLUDED.sponsor_organization
                """, (uuid, name, detail, emoji, prize_type, sponsor, sponsor_org))

    db_connection.commit()
    cur.close()
    return len(projects)

