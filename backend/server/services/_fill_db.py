import psycopg2

def fill_db(db_connection: psycopg2.extensions.connection, projects: list[dict]) -> int:
    cur = db_connection.cursor()
    for project in projects:
        uuid = project.get("uuid")
        slug = project.get("slug") or ""
        emoji = project.get("emoji")
        name = project.get("name") or ""
        tagline = project.get("tagline", "") or ""
        description = project.get("description", "") or ""
        how_its_made = project.get("howItsMade", "") or ""
        source_code_url = project.get("sourceCodeUrl")
        url = project.get("url")
        event_name = (project.get("event") or {}).get("name", "")
        logo_url = ((project.get("logo") or {}).get("file") or {}).get("fullUrl")
        banner_url = ((project.get("banner") or {}).get("file") or {}).get("fullUrl")

        # Extract screenshots as array of URLs
        screenshots = []
        for screenshot in project.get("screenshots", []):
            screenshot_url = ((screenshot.get("file") or {}).get("fullUrl"))
            if screenshot_url:
                screenshots.append(screenshot_url)

        # Extract video information
        video = project.get("video") or {}
        video_file_url = ((video.get("file") or {}).get("fullUrl"))
        video_mux_url = video.get("muxUrl")
        video_mux_thumbnail_url = video.get("muxThumbnailUrl")
        video_youtube_id = video.get("youtubeId")

        # Extract primary repository URL
        primary_repository_url = ((project.get("primaryRepository") or {}).get("url"))

        # Insert or update project
        cur.execute("""
            INSERT INTO project (uuid, slug, emoji, name, tagline, description, how_its_made, 
                                source_code_url, url, event_name, logo_url, banner_url,
                                screenshots, video_file_url, video_mux_url, video_mux_thumbnail_url,
                                video_youtube_id, primary_repository_url)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (uuid) DO UPDATE
            SET slug = EXCLUDED.slug,
                emoji = EXCLUDED.emoji,
                name = EXCLUDED.name,
                tagline = EXCLUDED.tagline,
                description = EXCLUDED.description,
                how_its_made = EXCLUDED.how_its_made,
                source_code_url = EXCLUDED.source_code_url,
                url = EXCLUDED.url,
                event_name = EXCLUDED.event_name,
                logo_url = EXCLUDED.logo_url,
                banner_url = EXCLUDED.banner_url,
                screenshots = EXCLUDED.screenshots,
                video_file_url = EXCLUDED.video_file_url,
                video_mux_url = EXCLUDED.video_mux_url,
                video_mux_thumbnail_url = EXCLUDED.video_mux_thumbnail_url,
                video_youtube_id = EXCLUDED.video_youtube_id,
                primary_repository_url = EXCLUDED.primary_repository_url
        """, (uuid, slug, emoji, name, tagline, description, how_its_made,
            source_code_url, url, event_name, logo_url, banner_url,
            screenshots, video_file_url, video_mux_url, video_mux_thumbnail_url,
            video_youtube_id, primary_repository_url))

        # Insert prizes
        prizes = project.get("prizes", [])
        for prize in prizes:
            name = prize.get("name", "") or ""
            pool_prize = prize.get("poolPrize")
            prize_data = prize.get("prize", {}) or {}

            prize_name = prize_data.get("name")
            prize_emoji = prize_data.get("emoji")
            prize_type = prize_data.get("type")

            sponsor = prize_data.get("sponsor") or {}
            sponsor_name = sponsor.get("name")
            sponsor_org = sponsor.get("organization") or {}
            sponsor_organization_name = sponsor_org.get("name")
            sponsor_organization_square_logo_url = ((sponsor_org.get("squareLogo") or {}).get("fullUrl"))

            cur.execute("""
                INSERT INTO prize (project_uuid, name, pool_prize, prize_name, prize_emoji, 
                                  prize_type, sponsor_name, sponsor_organization_name, 
                                  sponsor_organization_square_logo_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (project_uuid, name, prize_name) DO UPDATE
                SET pool_prize = EXCLUDED.pool_prize,
                    prize_emoji = EXCLUDED.prize_emoji,
                    prize_type = EXCLUDED.prize_type,
                    sponsor_name = EXCLUDED.sponsor_name,
                    sponsor_organization_name = EXCLUDED.sponsor_organization_name,
                    sponsor_organization_square_logo_url = EXCLUDED.sponsor_organization_square_logo_url
            """, (uuid, name, pool_prize, prize_name, prize_emoji, prize_type,
                sponsor_name, sponsor_organization_name, sponsor_organization_square_logo_url))

    db_connection.commit()
    cur.close()
    return len(projects)


def fill_db_links(db_connection: psycopg2.extensions.connection,
                  projects: list[dict]) -> int:
    cur = db_connection.cursor()
    for project in projects:
        uuid = project.get("uuid")
        logo_url = ((project.get("logo") or {}).get("file")
                    or {}).get("fullUrl")
        banner_url = ((project.get("banner") or {}).get("file")
                      or {}).get("fullUrl")

        # Extract screenshots as array of URLs
        screenshots = []
        for screenshot in project.get("screenshots", []):
            screenshot_url = ((screenshot.get("file") or {}).get("fullUrl"))
            if screenshot_url:
                screenshots.append(screenshot_url)

        # Extract video information
        video = project.get("video") or {}
        video_file_url = ((video.get("file") or {}).get("fullUrl"))

        cur.execute(
            """
            UPDATE project SET 
                logo_url = %s, 
                banner_url = %s,
                screenshots = %s,
                video_file_url = %s
            WHERE uuid = %s
        """, (logo_url, banner_url, screenshots, video_file_url, uuid))

        # Update prizes with square logo URLs
        prizes = project.get("prizes", [])
        for prize in prizes:
            name = prize.get("name", "") or ""
            prize_data = prize.get("prize", {}) or {}
            sponsor = prize_data.get("sponsor") or {}
            sponsor_org = sponsor.get("organization") or {}
            sponsor_organization_square_logo_url = ((
                sponsor_org.get("squareLogo") or {}).get("fullUrl"))
            # Get prize_name for the conflict resolution
            prize_name = prize_data.get("name")

            if prize_name:  # Only update if we have a prize_name to match on
                cur.execute(
                    """
                    UPDATE prize SET 
                        sponsor_organization_square_logo_url = %s
                    WHERE project_uuid = %s 
                      AND name = %s 
                """, (sponsor_organization_square_logo_url, uuid, name))

    db_connection.commit()
    cur.close()
    return len(projects)
