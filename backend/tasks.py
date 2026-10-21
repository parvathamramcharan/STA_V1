import os
import json
import uuid
import time
import redis
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv('REDIS_URL', 'redis://redis:6379/0')
PDF_TMP_DIR = '/tmp/pdf_jobs'
os.makedirs(PDF_TMP_DIR, exist_ok=True)
os.chmod(PDF_TMP_DIR, 0o777)

celery_app = Celery('tasks', broker=REDIS_URL, backend=REDIS_URL)
celery_app.conf.update(task_serializer='json', result_expires=3600)

_redis = redis.from_url(REDIS_URL)


def _set_status(job_id, status, filename=None, error=None, total_ips=None):
    payload = {'status': status}
    if status == 'pending':
        payload['started_at'] = time.time()
    if filename:
        payload['filename'] = filename
    if error:
        payload['error'] = error
    if total_ips is not None:
        payload['total_ips'] = total_ips
    _redis.setex(f'pdf_job:{job_id}', 3600, json.dumps(payload))


def _enrich_rows_with_pcap_appearance_data(rows, pcaps_map=None):
    import elastic as elastic_mod
    try:
        if hasattr(elastic_mod, 'enrich_rows_with_pcap_appearance_data'):
            return elastic_mod.enrich_rows_with_pcap_appearance_data(rows, pcaps_map=pcaps_map)
    except Exception as e:
        print(f'[Compat] tasks enrich helper call failed: {e}')

    rows = list(rows or [])
    if not rows:
        return rows

    if pcaps_map is None:
        ip_list = [row.get('ip') for row in rows if row.get('ip')]
        pcaps_map = elastic_mod.get_pcaps_for_ips_bulk(ip_list) if ip_list else {}

    for row in rows:
        ip = row.get('ip')
        entries = pcaps_map.get(ip, []) if isinstance(pcaps_map, dict) else []
        normalized_entries = []
        if isinstance(entries, list):
            normalized_entries = [e for e in entries if isinstance(e, dict)]
        elif isinstance(entries, dict):
            normalized_entries = [entries]

        pcap_names = [entry.get('filename') for entry in normalized_entries if entry.get('filename')]
        pcap_names_text = ', '.join(pcap_names) if pcap_names else ''
        pcap_count = len(pcap_names)
        row['_pcaps'] = normalized_entries
        row['pcap_names'] = pcap_names_text
        row['pcap_name'] = pcap_names_text
        row['pcapName'] = pcap_names_text
        row['pcapNames'] = pcap_names_text
        row['pcap_appearances'] = pcap_names_text
        row['pcap_appearance_names'] = pcap_names_text
        row['pcap_files'] = pcap_names
        row['pcapFiles'] = pcap_names
        row['pcap_file_names'] = pcap_names
        row['pcap_names_list'] = pcap_names
        row['pcap_count'] = pcap_count
        row['pcapCount'] = pcap_count
        row['pcap_appearance_count'] = pcap_count
        row['pcapAppearanceCount'] = pcap_count

    return rows


def _build_ip_rows(es, packet_map):
    import elastic as elastic_mod
    ip_rows = []
    if not packet_map:
        return ip_rows
    res = es.mget(index=elastic_mod.IP_INTEL_INDEX, body={'ids': list(packet_map.keys())})
    for doc in res['docs']:
        if doc.get('found'):
            row = dict(doc['_source'])
            row['packet_count'] = packet_map.get(row.get('ip'), 0)
            ip_rows.append(row)
    ip_rows.sort(key=lambda r: r.get('packet_count', 0), reverse=True)
    pcaps_map = elastic_mod.get_pcaps_for_ips_bulk(list(packet_map.keys()))
    return _enrich_rows_with_pcap_appearance_data(ip_rows, pcaps_map=pcaps_map)


@celery_app.task(bind=True)
def generate_pcap_report_pdf_task(self, job_id, pcap_id, report_type, report_value, password):
    try:
        import elastic as elastic_mod
        from report_pdf import build_pdf
        _set_status(job_id, 'pending')
        es = elastic_mod.get_es()
        flat_rows = elastic_mod.get_pcap_report_details(pcap_id, report_type, report_value)
        packet_map = {r['ip']: r.get('packet_count', 0) for r in flat_rows if r.get('ip')}
        ip_rows = _build_ip_rows(es, packet_map)
        pdf_bytes = build_pdf(
            title=report_value,
            subtitle='Report',
            meta_pairs=[('PCAP ID', pcap_id)],
            ip_rows=ip_rows,
            section_title=f'IPs for {report_type.title()}: {report_value}',
            password=password,
            report_type=report_type,
            report_value=report_value,
        )
        safe = report_value.replace('/', '_').replace(' ', '_')
        filename = f'{pcap_id}_{report_type}_{safe}_report.pdf'
        path = os.path.join(PDF_TMP_DIR, f'{job_id}.pdf')
        with open(path, 'wb') as f:
            f.write(pdf_bytes)
        os.chmod(path, 0o666)
        _set_status(job_id, 'done', filename=filename, total_ips=len(ip_rows))
    except Exception as e:
        _set_status(job_id, 'failed', error=str(e))
        raise


@celery_app.task(bind=True)
def generate_report_details_pdf_task(self, job_id, report_type, report_value, password):
    try:
        import elastic as elastic_mod
        from report_pdf import build_pdf
        _set_status(job_id, 'pending')
        es = elastic_mod.get_es()
        flat_rows = elastic_mod.get_report_details(report_type, report_value)
        packet_map = {r['ip']: r.get('packet_count', 0) for r in flat_rows if r.get('ip')}
        ip_rows = _build_ip_rows(es, packet_map)
        pdf_bytes = build_pdf(
            title=report_value,
            subtitle='Report',
            meta_pairs=[],
            ip_rows=ip_rows,
            section_title=f'IPs for {report_type.title()}: {report_value}',
            password=password,
            report_type=report_type,
            report_value=report_value,
        )
        safe = report_value.replace('/', '_').replace(' ', '_')
        filename = f'{report_type}_{safe}_report.pdf'
        path = os.path.join(PDF_TMP_DIR, f'{job_id}.pdf')
        with open(path, 'wb') as f:
            f.write(pdf_bytes)
        os.chmod(path, 0o666)
        _set_status(job_id, 'done', filename=filename, total_ips=len(ip_rows))
    except Exception as e:
        _set_status(job_id, 'failed', error=str(e))
        raise


@celery_app.task(bind=True)
def generate_pcap_ip_intelligence_pdf_task(self, job_id, pcap_id, password):
    try:
        import elastic as elastic_mod
        from report_pdf import build_pdf
        _set_status(job_id, 'pending')
        es = elastic_mod.get_es()
        meta = elastic_mod.get_dashboard_document(pcap_id)
        if not meta:
            _set_status(job_id, 'failed', error=f'No analysis found for {pcap_id}')
            return
        external_ips = elastic_mod.get_external_ips_for_pcap(pcap_id)
        packet_map = {e['ip']: e.get('packet_count', 0) for e in external_ips if e.get('ip')}
        intel_rows = _build_ip_rows(es, packet_map)
        filename_meta = meta.get('pcap_filename') or meta.get('file_name') or pcap_id
        pdf_bytes = build_pdf(
            title=f'PCAP Report \u2014 {filename_meta}',
            subtitle=f'IP Intelligence \u00b7 PCAP ID: {pcap_id}',
            meta_pairs=[
                ('PCAP ID',       pcap_id),
                ('Filename',      filename_meta),
                ('Total Packets', meta.get('total_packets')),
                ('Duration (s)',  meta.get('duration_seconds')),
                ('File Size',     meta.get('file_size')),
                ('Start Time',    meta.get('start_time_utc')),
                ('End Time',      meta.get('end_time_utc')),
                ('External IPs',  len(external_ips)),
                ('Intel Records', len(intel_rows)),
            ],
            ip_rows=intel_rows,
            section_title='External IP Intelligence',
            password=password,
        )
        path = os.path.join(PDF_TMP_DIR, f'{job_id}.pdf')
        with open(path, 'wb') as f:
            f.write(pdf_bytes)
        os.chmod(path, 0o666)
        _set_status(job_id, 'done', filename=f'{pcap_id}_ip_intelligence.pdf', total_ips=len(intel_rows))
    except Exception as e:
        _set_status(job_id, 'failed', error=str(e))
        raise
