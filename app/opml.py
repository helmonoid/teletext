import xml.etree.ElementTree as ET
from datetime import datetime, timezone

def export_opml(feed_urls):
    """Export feed URLs to OPML XML string."""
    opml = ET.Element('opml', version='2.0')
    head = ET.SubElement(opml, 'head')
    ET.SubElement(head, 'title').text = 'Teletext News Feeds'
    ET.SubElement(head, 'dateCreated').text = datetime.now(timezone.utc).strftime('%a, %d %b %Y %H:%M:%S %z')
    body = ET.SubElement(opml, 'body')
    for url in feed_urls:
        ET.SubElement(body, 'outline', type='rss', text=url, xmlUrl=url)
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + ET.tostring(opml, encoding='unicode')

def import_opml(xml_content):
    """Parse OPML XML string and return list of feed URL strings."""
    urls = []
    try:
        root = ET.fromstring(xml_content)
        for outline in root.iter('outline'):
            xml_url = outline.get('xmlUrl') or outline.get('xmlurl') or outline.get('url')
            if xml_url:
                urls.append(xml_url.strip())
    except ET.ParseError:
        pass
    return urls
