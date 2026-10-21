from datetime import datetime
from fpdf import FPDF

# ── Colours ───────────────────────────────────────────────────────────────────
C_NAVY      = (22,  50,  79)
C_BLUE      = (44, 111, 187)
C_BLUE_SOFT = (234, 241, 251)
C_SLATE     = (45,  55,  72)
C_BORDER    = (225, 230, 237)
C_BG_CARD   = (248, 250, 252)
C_WHITE     = (255, 255, 255)
C_BLACK     = (0,   0,   0)
C_BODY      = (15,  23,  36)
C_GREEN     = (30, 142,  90)
C_RED       = (192,  57,  43)
C_AMBER     = (183, 121,  31)

MARGIN   = 14.0
INNER_W  = 182.0
ROW_H    = 7.0        # slightly taller rows for breathing room
CARD_PAD = 4.0
COL_GAP  = 4.0
CARD_W   = (INNER_W - COL_GAP) / 2
PAGE_H   = 297.0
B_MARGIN = 18.0

_UNICODE_MAP = {
    "\u2014": "-", "\u2013": "-", "\u2012": "-",
    "\u2018": "'", "\u2019": "'",
    "\u201c": '"', "\u201d": '"',
    "\u2026": "...",
}


def _san(text):
    if text is None:
        return "N/A"
    s = str(text)
    for uc, asc in _UNICODE_MAP.items():
        s = s.replace(uc, asc)
    return s.encode("latin-1", errors="replace").decode("latin-1")


def _val(v):
    s = _san(v)
    return s if s not in ("", "-", "N/A", "None") else "N/A"


def _kv_card_h(n, extra_h=0):
    return CARD_PAD + 6 + 2 + n * ROW_H + extra_h + CARD_PAD


def _ports_card_h(n):
    return CARD_PAD + 6 + 2 + ROW_H + max(n, 1) * ROW_H + CARD_PAD


class ReportPDF(FPDF):
    def __init__(self, generated_on="", report_type="", report_value=""):
        super().__init__(orientation="P", unit="mm", format="A4")
        self.set_auto_page_break(auto=False)
        self.set_margins(MARGIN, 0, MARGIN)
        self._generated_on = generated_on
        self._report_type  = report_type
        self._report_value = report_value

    def _avail(self):
        return PAGE_H - B_MARGIN - self.get_y()

    def _ensure(self, needed):
        if self._avail() < needed:
            self.add_page()

    def footer(self):
        if self.page_no() == 1:
            return
        self.set_y(PAGE_H - 10)
        self.set_font("Helvetica", "", 7)
        self.set_text_color(*C_SLATE)
        self.set_x(MARGIN)
        self.cell(INNER_W / 2, 5, f"Report Generated: {self._generated_on}", align="L")
        self.set_x(MARGIN + INNER_W / 2)
        self.cell(INNER_W / 2, 5, f"Page {self.page_no() - 1}", align="R")
        self.set_text_color(*C_BLACK)

    # ── Cover ──────────────────────────────────────────────────────────────────
    def cover(self, title, subtitle, generated, total, meta_pairs):
        self.add_page()
        self.set_fill_color(*C_NAVY)
        self.rect(0, 0, self.w, self.h, style="F")
        self.set_xy(30, 41.7)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(*C_WHITE)
        self.cell(0, 6, _san(subtitle).upper(), ln=True)
        self.set_xy(30, 61.6)
        self.set_font("Helvetica", "B", 48)
        self.multi_cell(self.w - 60, 20, _san(title).upper(), align="L")
        self.set_xy(30, 141.7)
        self.set_font("Helvetica", "B", 12)
        self.set_text_color(107, 118, 134)
        self.cell(0, 7, f"GENERATED ON: {generated}", ln=True)
        self.set_x(30)
        self.cell(0, 7, f"TOTAL IDENTIFIERS: {total}", ln=True)
        for label, value in (meta_pairs or []):
            if value is not None:
                self.set_x(30)
                self.cell(0, 7, f"{_san(str(label)).upper()}: {_san(str(value))}", ln=True)

    # ── Page header ────────────────────────────────────────────────────────────
    def _page_header_block(self, report_type=None, report_value=None, country=None, isp=None):
        self.set_y(10)
        self.set_x(MARGIN)
        self.set_font("Helvetica", "B", 14)
        self.set_text_color(*C_NAVY)
        self.cell(INNER_W * 0.55, 7, "IP Intelligence Report", ln=False)
        # show only the report type label in the top-right corner
        meta = []
        if report_type and report_value:
            meta.append((report_type.upper(), report_value))
        col_w = 55
        rx = MARGIN + INNER_W - col_w
        for label, val in meta:
            self.set_xy(rx, 10)
            self.set_font("Helvetica", "", 6)
            self.set_text_color(*C_SLATE)
            self.cell(col_w, 3.5, label.upper(), align="R", ln=True)
            self.set_x(rx)
            self.set_font("Helvetica", "B", 8.5)
            self.set_text_color(*C_NAVY)
            self.cell(col_w, 5, _san(val), align="R", ln=True)
            rx -= col_w + 4
        self.set_text_color(*C_BLACK)
        dy = 23
        self.set_fill_color(*C_NAVY)
        self.rect(MARGIN, dy, INNER_W * 0.4, 1.2, style="F")
        self.set_fill_color(*C_BLUE)
        self.rect(MARGIN + INNER_W * 0.4, dy, INNER_W * 0.3, 1.2, style="F")
        self.set_fill_color(*C_BORDER)
        self.rect(MARGIN + INNER_W * 0.7, dy, INNER_W * 0.3, 1.2, style="F")
        self.set_y(dy + 3)

    # ── Entry banner ───────────────────────────────────────────────────────────
    def _entry_banner(self, idx, ip, status, last_seen, isp=None, pcap_count=None):
        bh = 20
        y = self.get_y()
        self.set_fill_color(*C_NAVY)
        self.rect(MARGIN, y, INNER_W, bh, style="F")
        # index number top-left
        self.set_xy(MARGIN + CARD_PAD, y + 2.5)
        self.set_font("Helvetica", "", 6.5)
        self.set_text_color(169, 193, 222)
        self.cell(60, 4, str(idx), ln=True)
        # IP address
        self.set_x(MARGIN + CARD_PAD)
        self.set_font("Helvetica", "B", 18)
        self.set_text_color(*C_WHITE)
        self.cell(110, 10, _san(ip), ln=False)
        # last seen top-right
        self.set_xy(MARGIN + INNER_W - 70, y + 3)
        self.set_font("Helvetica", "", 6.5)
        self.set_text_color(169, 193, 222)
        self.cell(66, 4, f"Last Seen: {_val(last_seen)}", align="R")
        self.set_text_color(*C_BLACK)
        self.set_y(y + bh + 3)

    # ── Card primitives ────────────────────────────────────────────────────────
    def _draw_card(self, x, y, w, h):
        self.set_fill_color(*C_BG_CARD)
        self.set_draw_color(*C_BORDER)
        self.set_line_width(0.3)
        self.rect(x, y, w, h, style="FD")

    def _card_title(self, x, y, w, title):
        self.set_xy(x + CARD_PAD, y + CARD_PAD)
        self.set_font("Helvetica", "B", 7.5)
        self.set_text_color(*C_BLUE)
        self.cell(w - CARD_PAD * 2, 6, title.upper(), ln=True)
        ty = y + CARD_PAD + 6
        self.set_draw_color(*C_BORDER)
        self.line(x, ty, x + w, ty)
        return ty + 2

    def _kv_row(self, x, y, w, key, val, last=False):
        val_str = _val(val)
        val_w = w * 0.52
        self.set_font("Helvetica", "B", 7.5)
        # measure how many lines the value needs
        char_w = self.get_string_width(val_str)
        extra_lines = max(0, int(char_w / (val_w - CARD_PAD)) )
        row_h = ROW_H * (extra_lines + 1) if extra_lines > 0 else ROW_H

        self.set_xy(x + CARD_PAD, y + (row_h - ROW_H) / 2)
        self.set_font("Helvetica", "", 7)
        self.set_text_color(*C_SLATE)
        self.cell(w * 0.44, ROW_H, _san(key), ln=False)

        self.set_font("Helvetica", "B", 7.5)
        self.set_text_color(*C_BODY)
        val_x = x + CARD_PAD + w * 0.44
        if extra_lines > 0:
            self.set_xy(val_x, y)
            self.multi_cell(val_w - CARD_PAD, ROW_H, val_str, align="R")
        else:
            self.set_xy(val_x, y)
            self.cell(val_w, ROW_H, val_str, align="R", ln=True)

        if not last:
            self.set_draw_color(*C_BORDER)
            self.set_line_width(0.1)
            self.dashed_line(x + CARD_PAD, y + row_h, x + w - CARD_PAD, y + row_h, 1, 1)
        self.set_text_color(*C_BLACK)
        return y + row_h

    def _kv_card(self, x, y, w, h, title, rows):
        """Draw kv card at exact (x,y,w,h) — caller controls height for alignment."""
        self._draw_card(x, y, w, h)
        cy = self._card_title(x, y, w, title)
        for i, (k, v) in enumerate(rows):
            cy = self._kv_row(x, cy, w, k, v, last=(i == len(rows) - 1))
        return y + h

    def _kv_card_extra_h(self, w, rows):
        """Calculate extra height needed for rows with long values."""
        extra = 0
        self.set_font("Helvetica", "B", 7.5)
        val_w = w * 0.52 - CARD_PAD
        for _, v in rows:
            val_str = _val(v)
            char_w = self.get_string_width(val_str)
            lines = int(char_w / val_w)
            extra += lines * ROW_H
        return extra

    # ── Ports card ─────────────────────────────────────────────────────────────
    def _ports_card(self, x, y, w, h, ports):
        """Draw ports card at exact (x,y,w,h)."""
        headers = ["PORT", "SERVICE", "PROTO", "STATE"]
        cws = [w * f for f in (0.18, 0.38, 0.22, 0.22)]
        self._draw_card(x, y, w, h)
        cy = self._card_title(x, y, w, "Active Network Services")
        self.set_fill_color(*C_NAVY)
        self.set_text_color(*C_WHITE)
        self.set_font("Helvetica", "B", 6.5)
        rx = x
        for hdr, cw in zip(headers, cws):
            self.set_xy(rx, cy)
            self.cell(cw, ROW_H, "  " + hdr, fill=True)
            rx += cw
        cy += ROW_H
        if ports:
            for i, p in enumerate(ports):
                self.set_fill_color(*(C_BG_CARD if i % 2 == 0 else C_WHITE))
                self.set_text_color(*C_BODY)
                self.set_font("Helvetica", "", 7)
                rx = x
                for val, cw in zip(
                    [p.get("port"), p.get("service"), p.get("protocol"), p.get("state")],
                    cws
                ):
                    self.set_xy(rx, cy)
                    self.cell(cw, ROW_H, "  " + _val(val), fill=True)
                    rx += cw
                cy += ROW_H
        else:
            self.set_xy(x + CARD_PAD, cy)
            self.set_font("Helvetica", "I", 7)
            self.set_text_color(*C_SLATE)
            self.cell(w, ROW_H, "No open services detected.", ln=True)
        self.set_text_color(*C_BLACK)

    # ── Section label ──────────────────────────────────────────────────────────
    def _section_label(self, text, right_text=""):
        y = self.get_y()
        self.set_fill_color(*C_BLUE)
        self.rect(MARGIN, y, 2.5, 6, style="F")
        self.set_xy(MARGIN + 4, y)
        self.set_font("Helvetica", "B", 8.5)
        self.set_text_color(*C_NAVY)
        self.cell(80, 6, text, ln=False)
        if right_text:
            self.set_font("Helvetica", "", 8)
            self.set_text_color(*C_SLATE)
            self.cell(0, 6, right_text, ln=True)
        else:
            self.ln(6)
        self.set_text_color(*C_BLACK)
        self.ln(2)

    # ── Contacts table ─────────────────────────────────────────────────────────
    def _contacts_section(self, contacts):
        roles = ["administrative", "abuse", "technical", "registrant"]
        all_rows = []
        for role in roles:
            entries = _get_contacts(contacts, role)
            if not entries:
                entries = [{}]
            for c in entries:
                all_rows.append((role, c))

        tbl_row_h = ROW_H + 1.5   # extra padding per row
        needed = 8 + 2 + tbl_row_h + len(all_rows) * tbl_row_h
        self._ensure(needed)

        self._section_label("Ownership Contacts")
        cws = [INNER_W * f for f in (0.22, 0.28, 0.30, 0.20)]
        hdrs = ["CONTACT TYPE", "NAME", "EMAIL", "PHONE"]
        self.set_fill_color(*C_NAVY)
        self.set_text_color(*C_WHITE)
        self.set_font("Helvetica", "B", 7)
        self.set_x(MARGIN)
        for h, cw in zip(hdrs, cws):
            self.cell(cw, tbl_row_h, "  " + h, fill=True)
        self.ln()
        for i, (role, c) in enumerate(all_rows):
            self.set_fill_color(*(C_BG_CARD if i % 2 == 0 else C_WHITE))
            self.set_draw_color(*C_BORDER)
            self.set_text_color(*C_BODY)
            self.set_font("Helvetica", "B", 7)
            self.set_x(MARGIN)
            self.cell(cws[0], tbl_row_h, "  " + role.upper(), border=1, fill=True)
            self.set_font("Helvetica", "", 7)
            for val, cw in zip([c.get("name"), c.get("email"), c.get("phone")], cws[1:]):
                self.cell(cw, tbl_row_h, "  " + _val(val), border=1, fill=True)
            self.ln()
        self.set_text_color(*C_BLACK)

    # ── PCAP section ───────────────────────────────────────────────────────────
    def _pcap_section(self, intel):
        pcap_list = intel.get("_pcaps") or []
        pcap_count = (
            intel.get("pcap_count")
            or intel.get("pcap_appearance_count")
            or len(pcap_list)
            or 0
        )
        rows = pcap_list if pcap_list else [{"filename": "N/A"}]
        tbl_row_h = ROW_H + 1.5

        needed = 8 + 2 + tbl_row_h + len(rows) * tbl_row_h
        self._ensure(needed)

        # PCAP Appearances label with bold count right-aligned
        y = self.get_y()
        self.set_fill_color(*C_BLUE)
        self.rect(MARGIN, y, 2.5, 6, style="F")
        self.set_xy(MARGIN + 4, y)
        self.set_font("Helvetica", "B", 8.5)
        self.set_text_color(*C_NAVY)
        self.cell(0, 6, "PCAP Appearances", ln=False)
        self.set_font("Helvetica", "B", 9)
        self.set_text_color(*C_BLUE)
        self.set_xy(MARGIN, y)
        self.cell(INNER_W, 6, str(pcap_count), align="R", ln=True)
        self.set_text_color(*C_BLACK)
        self.ln(2)
        cws = [INNER_W * 0.08, INNER_W * 0.92]
        self.set_fill_color(*C_NAVY)
        self.set_text_color(*C_WHITE)
        self.set_font("Helvetica", "B", 7)
        self.set_x(MARGIN)
        for hdr, cw in zip(["#", "FILENAME"], cws):
            self.cell(cw, tbl_row_h, "  " + hdr, fill=True)
        self.ln()
        for i, p in enumerate(rows, start=1):
            self.set_fill_color(*(C_BG_CARD if i % 2 == 0 else C_WHITE))
            self.set_draw_color(*C_BORDER)
            self.set_text_color(*C_BODY)
            self.set_font("Helvetica", "", 7)
            self.set_x(MARGIN)
            num = str(i) if pcap_list else "N/A"
            self.cell(cws[0], tbl_row_h, "  " + num, border=1, fill=True)
            self.cell(cws[1], tbl_row_h, "  " + _val(p.get("filename")), border=1, fill=True)
            self.ln()
        self.set_text_color(*C_BLACK)

    # ── IP page ────────────────────────────────────────────────────────────────
    def ip_page(self, idx, ip, intel):
        geo   = intel.get("geo")     if isinstance(intel.get("geo"),     dict) else {}
        whois = intel.get("whois")   if isinstance(intel.get("whois"),   dict) else {}
        dnsbl = intel.get("dnsbl")   if isinstance(intel.get("dnsbl"),   dict) else {}
        os_i  = intel.get("os_info") if isinstance(intel.get("os_info"), dict) else {}
        ports = intel.get("ports")   if isinstance(intel.get("ports"),   list) else []
        w     = whois if isinstance(whois, dict) else {}

        listed = "LISTED / AT RISK" if dnsbl.get("listed") else "CLEAN"
        lat = geo.get("latitude")  or (intel.get("location") or {}).get("lat")
        lon = geo.get("longitude") or (intel.get("location") or {}).get("lon")
        coords = f"{lat}, {lon}" if lat and lon else "N/A"

        pcap_list  = intel.get("_pcaps") or []
        pcap_count = (
            intel.get("pcap_count")
            or intel.get("pcap_appearance_count")
            or len(pcap_list)
            or 0
        )

        self.add_page()
        self._page_header_block(
            report_type=self._report_type,
            report_value=self._report_value,
            country=geo.get("country"),
            isp=geo.get("isp"),
        )
        self._entry_banner(
            idx, ip,
            status=intel.get("status"),
            last_seen=intel.get("last_seen"),
        )

        # ── Row 1: Host Identity (left) + Active Network Services (right) ─────
        host_rows = [
            ("ASN",           intel.get("asn")),
            ("OS Match",      os_i.get("best_match")),
            ("OS Confidence", f"{os_i.get('confidence')}%" if os_i.get("confidence") else "N/A"),
            ("DNSBL Status",  listed),
            ("Hostname/rDNS", intel.get("rdns")),
            ("Proxy Type",    intel.get("proxy_type")),
        ]
        h_host  = _kv_card_h(len(host_rows), self._kv_card_extra_h(CARD_W, host_rows))
        h_ports = _ports_card_h(len(ports))
        row1_h  = max(h_host, h_ports)   # both cards same height

        self._ensure(row1_h + 4)
        y0 = self.get_y()
        self._kv_card(MARGIN,               y0, CARD_W, row1_h, "Host Identity",          host_rows)
        self._ports_card(MARGIN + CARD_W + COL_GAP, y0, CARD_W, row1_h, ports)
        self.set_y(y0 + row1_h + 4)

        # ── Row 2: Geographic Intelligence (left) + Ownership Information (right)
        geo_rows = [
            ("City",        geo.get("city")),
            ("Country",     geo.get("country")),
            ("ISP",         geo.get("isp")),
            ("Coordinates", coords),
        ]
        own_rows = [
            ("Organization",  w.get("org") or w.get("name")),
            ("Network Owner", w.get("network_owner")),
            ("CIDR",          w.get("cidr")),
            ("Registrar",     w.get("registrar")),
            ("TLD / Website", f"{w.get('tld','N/A')} / {w.get('website','N/A')}"),
            ("Registered",    w.get("registered")),
        ]
        h_geo  = _kv_card_h(len(geo_rows), self._kv_card_extra_h(CARD_W, geo_rows))
        h_own  = _kv_card_h(len(own_rows), self._kv_card_extra_h(CARD_W, own_rows))
        row2_h = max(h_geo, h_own)

        self._ensure(row2_h + 4)
        y1 = self.get_y()
        self._kv_card(MARGIN,               y1, CARD_W, row2_h, "Geographic Intelligence", geo_rows)
        self._kv_card(MARGIN + CARD_W + COL_GAP, y1, CARD_W, row2_h, "Ownership Information", own_rows)
        self.set_y(y1 + row2_h + 4)

        # ── Contacts ──────────────────────────────────────────────────────────
        raw_contacts = w.get("contacts")
        contacts = raw_contacts if isinstance(raw_contacts, (dict, list)) else {}
        self.ln(2)
        self._contacts_section(contacts)

        # ── PCAP ──────────────────────────────────────────────────────────────
        self.ln(3)
        self._pcap_section(intel)


def _get_contacts(contacts, role):
    if isinstance(contacts, dict):
        val = contacts.get(role)
        if isinstance(val, dict): return [val]
        if isinstance(val, list): return [c for c in val if isinstance(c, dict)]
        return []
    if isinstance(contacts, list):
        return [c for c in contacts if isinstance(c, dict) and c.get("type", "").lower() == role]
    return []


def build_pdf(title: str, subtitle: str, meta_pairs: list, ip_rows: list,
              section_title: str = "IP Intelligence Details",
              password: str = "", max_ips: int = 400,
              report_type: str = "", report_value: str = "") -> bytes:
    ip_rows = ip_rows[:max_ips]
    from zoneinfo import ZoneInfo
    ist = ZoneInfo("Asia/Kolkata")
    now_ist = datetime.now(ist)
    generated = now_ist.strftime("%d/%m/%Y, %I:%M:%S %p IST")
    pdf = ReportPDF(generated_on=generated, report_type=report_type, report_value=report_value)
    pdf.cover(title, subtitle, generated, len(ip_rows), meta_pairs)
    for idx, row in enumerate(ip_rows, start=1):
        pdf.ip_page(idx, row.get("ip", "Unknown"), row)
    if password:
        pdf.set_encryption(owner_password=password, user_password=password)
    return bytes(pdf.output())
