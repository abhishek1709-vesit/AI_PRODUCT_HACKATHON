import os
from io import BytesIO
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from sqlalchemy.orm import Session
from backend.models.models import (
    Evaluation, Vendor, Requirement, VendorAnalysis,
    Risk, VendorCost, Recommendation, NegotiationStrategy,
    ProposalChunk
)

# ---------------------------------------------------------------------------
# Unicode font registration — DejaVu covers ₹ – → • ✓ and all Latin chars
# ---------------------------------------------------------------------------
_FONT_REGISTERED = False

def _register_unicode_font():
    """Register DejaVuSans from reportlab's bundled fonts if available,
    otherwise fall back to a system DejaVu or skip (Helvetica fallback)."""
    global _FONT_REGISTERED
    if _FONT_REGISTERED:
        return "DejaVuSans"

    # Ordered preference: Calibri > Segoe UI > Arial > DejaVu (all support ₹, –, etc.)
    candidate_paths = [
        # Bundled alongside this file (if manually placed)
        os.path.join(os.path.dirname(__file__), "DejaVuSans.ttf"),
        # Windows system fonts — broad Unicode coverage
        r"C:\Windows\Fonts\calibri.ttf",
        r"C:\Windows\Fonts\Calibri.ttf",
        r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\SegoeUI.ttf",
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\Arial.ttf",
        r"C:\Windows\Fonts\arialuni.ttf",
        # Linux / macOS
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/dejavu-sans-fonts/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
    ]

    for path in candidate_paths:
        if os.path.isfile(path):
            try:
                pdfmetrics.registerFont(TTFont("DejaVuSans", path))
                _FONT_REGISTERED = True
                print(f"[REPORT] Registered Unicode font: {path}")
                return "DejaVuSans"
            except Exception as e:
                print(f"[REPORT] Font registration failed for {path}: {e}")

    print("[REPORT] No Unicode TTF found — using Helvetica (some chars may render as boxes)")
    return "Helvetica"


def _safe(text: str) -> str:
    """Replace characters that Helvetica cannot render with ASCII equivalents,
    in case the Unicode font is unavailable."""
    if text is None:
        return ""
    return (
        str(text)
        .replace("₹", "INR ")
        .replace("\u2013", "-")   # en-dash
        .replace("\u2014", "-")   # em-dash
        .replace("\u2022", "*")   # bullet
        .replace("\u2192", "->")  # arrow
        .replace("\u2713", "OK")  # check mark
        .replace("\u00a0", " ")   # nbsp
    )


_PLACEHOLDER_STRINGS = {
    "see proposal chunks",
    "see proposal chunk",
    "evidence unavailable",
    "no evidence",
    "n/a",
    "na",
    "",
}


def _is_real_evidence(ev) -> bool:
    """Return True only when ev contains actual substantive evidence text."""
    if not ev:
        return False
    # Strip whitespace and trailing punctuation like periods
    cleaned = ev.strip().lower().rstrip('.!')
    if cleaned in _PLACEHOLDER_STRINGS:
        return False
    # Also check if it's broadly referencing chunks
    if 'see proposal chunk' in cleaned:
        return False
    return len(cleaned) > 5


class ReportService:
    def __init__(self, db: Session):
        self.db = db
        self.unicode_font = _register_unicode_font()

        self.styles = getSampleStyleSheet()

        # Build all paragraph styles using the registered font so ₹ renders
        uf = self.unicode_font
        self.title_style  = ParagraphStyle("ReportTitle",  fontName=uf, fontSize=18, spaceAfter=6, leading=22, alignment=1)
        self.h1_style     = ParagraphStyle("ReportH1",     fontName=uf, fontSize=14, spaceAfter=4, leading=18, spaceBefore=12)
        self.h2_style     = ParagraphStyle("ReportH2",     fontName=uf, fontSize=12, spaceAfter=3, leading=16, spaceBefore=8)
        self.h3_style     = ParagraphStyle("ReportH3",     fontName=uf, fontSize=11, spaceAfter=2, leading=14, spaceBefore=6)
        self.normal_style = ParagraphStyle("ReportNormal", fontName=uf, fontSize=9,  spaceAfter=2, leading=13, wordWrap="CJK")
        self.bold_style   = ParagraphStyle("ReportBold",   fontName=uf, fontSize=9,  spaceAfter=2, leading=13)
        self.small_style  = ParagraphStyle("ReportSmall",  fontName=uf, fontSize=8,  spaceAfter=1, leading=11, textColor=colors.HexColor("#555555"), leftIndent=12)
        self.evidence_style = ParagraphStyle(
            "ReportEvidence", fontName=uf, fontSize=8, spaceAfter=2, leading=12,
            leftIndent=12, textColor=colors.HexColor("#333333"),
            borderPadding=4, backColor=colors.HexColor("#F5F5F5"),
            wordWrap="CJK"
        )
        self.alert_style  = ParagraphStyle("ReportAlert",  fontName=uf, fontSize=9,  spaceAfter=2, leading=13, textColor=colors.red)
        self.source_style = ParagraphStyle("ReportSource", fontName=uf, fontSize=7,  spaceAfter=3, leading=10, textColor=colors.HexColor("#777777"), leftIndent=12)

    # -----------------------------------------------------------------------
    # Evidence helpers
    # -----------------------------------------------------------------------

    def _chunk_fallback(self, vendor_id, page_number, section) -> str:
        """Deterministic fallback: find a chunk matching vendor+page+section.
        No LLM, no embedding search — pure DB lookup by exact coordinates."""
        if not vendor_id or page_number is None:
            return ""
        try:
            chunk = self.db.query(ProposalChunk).filter(
                ProposalChunk.vendor_id == vendor_id,
                ProposalChunk.page_number == page_number,
                ProposalChunk.section == section
            ).first()
            if chunk and chunk.chunk_text and len(chunk.chunk_text.strip()) > 10:
                # Return a sensible excerpt (first 300 chars)
                return chunk.chunk_text.strip()[:300]
        except Exception as e:
            print(f"[REPORT] chunk_fallback error: {e}")
        return ""

    def _resolve_evidence(self, record: dict, vendor_id_field="vendor_id") -> dict:
        """Return a dict with keys: evidence, page_number, section, source_label.
        Applies the fallback to proposal_chunks when stored evidence is a placeholder."""
        raw_ev = record.get("evidence", "") or ""
        page   = record.get("page_number")
        section = record.get("section") or ""
        vendor_id = record.get(vendor_id_field) or record.get("vendor_id")

        if _is_real_evidence(raw_ev):
            evidence = raw_ev.strip()
        else:
            # Attempt deterministic fallback from proposal_chunks
            evidence = self._chunk_fallback(vendor_id, page, section) if section else ""

        source_parts = []
        if page is not None:
            source_parts.append(f"Page {page}")
        if section:
            source_parts.append(section)
        source_label = " \u00b7 ".join(source_parts) if source_parts else None  # ·

        return {
            "evidence": evidence,
            "page_number": page,
            "section": section,
            "source_label": source_label,
        }

    # -----------------------------------------------------------------------
    # PDF element builders
    # -----------------------------------------------------------------------

    def _fmt_currency(self, value) -> str:
        """Format a numeric value as INR with proper ₹ symbol."""
        if value is None:
            return "Not available"
        try:
            return f"\u20b9{float(value):,.0f}"   # ₹
        except (TypeError, ValueError):
            return str(value)

    def _add_evidence_block(self, elements, ev_info: dict):
        """Append a styled evidence + source line to the elements list."""
        ev = ev_info["evidence"]
        source = ev_info["source_label"]

        if ev:
            # Truncate very long quotes to keep the PDF readable
            display_ev = ev[:400] + ("..." if len(ev) > 400 else "")
            elements.append(Paragraph(f'<i>"{display_ev}"</i>', self.evidence_style))
            if source:
                elements.append(Paragraph(f"Source: {source}", self.source_style))
        else:
            elements.append(Paragraph("<i>Evidence unavailable</i>", self.source_style))

    def _severity_style(self, severity: str):
        sev = (severity or "").upper()
        if sev in ("HIGH", "CRITICAL"):
            return self.alert_style
        return self.bold_style

    # -----------------------------------------------------------------------
    # Main report generator
    # -----------------------------------------------------------------------

    def generate_report(self, evaluation_id: str, data: dict) -> BytesIO:
        buffer = BytesIO()
        doc = SimpleDocTemplate(
            buffer, pagesize=letter,
            rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
        )
        elements = []
        uf = self.unicode_font

        vendors  = data.get("vendors", [])
        reqs     = data.get("requirements", [])
        v_map    = {v["id"]: v["name"] for v in vendors}
        rankings = data.get("ranking", [])
        comp_map = data.get("comparison", {})
        rec      = data.get("recommendation", {})
        priorities = data.get("priorities", {"requirements": 50, "cost": 30, "risk": 20})

        top_vid   = rankings[0] if rankings else None
        alt_vid   = rankings[1] if len(rankings) > 1 else None
        top_score = comp_map.get(top_vid, {}).get("final_score", 0) if top_vid else 0

        # ── 1. Cover ──────────────────────────────────────────────────────
        elements.append(Paragraph("PROCUREMENT DECISION REPORT", self.title_style))
        elements.append(Spacer(1, 12))
        eval_name = data.get("evaluation_name") or "Procurement Evaluation"
        elements.append(Paragraph(f"<b>Evaluation:</b> {eval_name}", self.normal_style))
        elements.append(Paragraph(
            f"<b>Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            self.normal_style
        ))
        elements.append(Spacer(1, 24))

        # ── 2. Executive Summary ──────────────────────────────────────────
        elements.append(Paragraph("1. EXECUTIVE SUMMARY", self.h1_style))
        elements.append(Paragraph(
            f"<b>Recommended Vendor:</b> {v_map.get(top_vid, 'None')}",
            self.normal_style
        ))
        elements.append(Paragraph(f"<b>Final Score:</b> {top_score} / 100", self.normal_style))
        if alt_vid:
            elements.append(Paragraph(
                f"<b>Best Alternative:</b> {v_map.get(alt_vid, 'None')}",
                self.normal_style
            ))
        elements.append(Spacer(1, 8))
        elements.append(Paragraph(rec.get("explanation") or "No explanation available.", self.normal_style))
        elements.append(Spacer(1, 24))

        # ── 3. Evaluation Objectives ──────────────────────────────────────
        elements.append(Paragraph("2. EVALUATION OBJECTIVES", self.h1_style))
        elements.append(Paragraph(f"<b>Requirement Priority:</b> {priorities.get('requirements', 50)}%", self.normal_style))
        elements.append(Paragraph(f"<b>Cost Priority:</b> {priorities.get('cost', 30)}%", self.normal_style))
        elements.append(Paragraph(f"<b>Risk Priority:</b> {priorities.get('risk', 20)}%", self.normal_style))
        elements.append(Spacer(1, 8))

        if reqs:
            req_data = [["Requirement", "Weight", "Priority"]]
            for r in reqs:
                req_data.append([
                    r.get("name", "Unknown"),
                    str(r.get("weight", 0)),
                    r.get("priority", "medium")
                ])
            req_table = Table(req_data, colWidths=[300, 80, 120])
            req_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
                ("TEXTCOLOR",  (0, 0), (-1, 0), colors.whitesmoke),
                ("ALIGN",      (0, 0), (-1, -1), "LEFT"),
                ("FONTNAME",   (0, 0), (-1, -1), uf),
                ("FONTSIZE",   (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F8FAFC")),
                ("GRID",       (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ]))
            elements.append(req_table)
        elements.append(Spacer(1, 24))

        # ── 4. Vendor Comparison ──────────────────────────────────────────
        elements.append(Paragraph("3. VENDOR COMPARISON", self.h1_style))
        comp_data = [["Vendor", "Req Score", "TCO (Est.)", "Risk Penalty", "Final Score", "Rank"]]
        for i, vid in enumerate(rankings):
            c    = comp_map.get(vid, {})
            vname = v_map.get(vid, "Unknown")
            tco_str = self._fmt_currency(c.get("estimated_tco"))
            comp_data.append([
                vname,
                f"{c.get('requirement_contribution', 0)}",
                tco_str,
                f"{c.get('risk_contribution', 0)}",
                f"{c.get('final_score', 0)}",
                f"#{i + 1}",
            ])

        comp_table = Table(comp_data, colWidths=[140, 65, 100, 75, 75, 45])
        comp_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A5F")),
            ("TEXTCOLOR",  (0, 0), (-1, 0), colors.whitesmoke),
            ("ALIGN",      (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME",   (0, 0), (-1, -1), uf),
            ("FONTSIZE",   (0, 0), (-1, -1), 9),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 8),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#EFF6FF")),
            ("GRID",       (0, 0), (-1, -1), 0.5, colors.HexColor("#93C5FD")),
            # Highlight winner row
            ("BACKGROUND", (0, 1), (-1, 1), colors.HexColor("#DBEAFE")),
        ]))
        elements.append(comp_table)
        elements.append(PageBreak())

        # ── 5. Requirement Analysis ───────────────────────────────────────
        elements.append(Paragraph("4. REQUIREMENT ANALYSIS", self.h1_style))
        va_list = data.get("vendor_analysis", [])

        for v in vendors:
            elements.append(Paragraph(f"Vendor: {v['name']}", self.h2_style))
            v_va = [a for a in va_list if a["vendor_id"] == v["id"]]
            if not v_va:
                elements.append(Paragraph("No requirement analysis found.", self.normal_style))
                elements.append(Spacer(1, 8))
                continue

            for a in v_va:
                req_name = next(
                    (r["name"] for r in reqs if r["id"] == a["requirement_id"]),
                    "Unknown"
                )
                status_raw = a.get("status", "unknown")
                status_display = status_raw.replace("_", " ").title()

                elements.append(Paragraph(f"<b>Requirement:</b> {req_name}", self.normal_style))
                elements.append(Paragraph(f"<b>Status:</b> {status_display}", self.normal_style))
                elements.append(Paragraph(
                    f"<b>Explanation:</b> {a.get('explanation', '')}",
                    self.normal_style
                ))

                # Resolve evidence with fallback
                ev_info = self._resolve_evidence(a, vendor_id_field="vendor_id")
                elements.append(Paragraph("<b>Evidence:</b>", self.bold_style))
                self._add_evidence_block(elements, ev_info)
                elements.append(Spacer(1, 8))

            elements.append(Spacer(1, 12))

        # ── 6. Commercial Analysis ────────────────────────────────────────
        elements.append(Paragraph("5. COMMERCIAL ANALYSIS", self.h1_style))
        costs = data.get("commercial_extraction", [])

        for v in vendors:
            elements.append(Paragraph(f"Vendor: {v['name']}", self.h2_style))
            vc = next((c for c in costs if c["vendor_id"] == v["id"]), None)
            if not vc:
                elements.append(Paragraph("No commercial data found.", self.normal_style))
                elements.append(Spacer(1, 8))
                continue

            c_data = [
                ["Cost Item", "Amount"],
                ["Subscription Cost",   self._fmt_currency(vc.get("subscription_cost"))],
                ["Implementation Cost", self._fmt_currency(vc.get("implementation_cost"))],
                ["Support Cost",        self._fmt_currency(vc.get("support_cost"))],
                ["Usage Cost",          self._fmt_currency(vc.get("usage_cost"))],
                ["Additional Costs",    self._fmt_currency(vc.get("additional_costs"))],
                ["Estimated TCO",       self._fmt_currency(vc.get("estimated_tco"))],
                ["Is Estimated",        "Yes" if vc.get("is_estimated") else "No"],
            ]
            c_table = Table(c_data, colWidths=[200, 300])
            c_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#334155")),
                ("TEXTCOLOR",  (0, 0), (-1, 0), colors.whitesmoke),
                ("FONTNAME",   (0, 0), (-1, -1), uf),
                ("FONTSIZE",   (0, 0), (-1, -1), 9),
                ("GRID",       (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F8FAFC")),
                # Emphasize TCO row
                ("BACKGROUND", (0, 6), (-1, 6), colors.HexColor("#FEF3C7")),
            ]))
            elements.append(c_table)

            # Commercial evidence if available
            if vc.get("notes"):
                elements.append(Spacer(1, 4))
                elements.append(Paragraph(f"<i>Notes: {vc['notes']}</i>", self.small_style))

            elements.append(Spacer(1, 12))

        elements.append(PageBreak())

        # ── 7. Risk Analysis ──────────────────────────────────────────────
        elements.append(Paragraph("6. RISK ANALYSIS", self.h1_style))
        risks = data.get("risks", [])

        for v in vendors:
            elements.append(Paragraph(f"Vendor: {v['name']}", self.h2_style))
            v_risks = [r for r in risks if r["vendor_id"] == v["id"]]
            if not v_risks:
                elements.append(Paragraph("No risks identified from the available evidence.", self.normal_style))
                elements.append(Spacer(1, 8))
                continue

            for r in v_risks:
                sev = (r.get("severity") or "low").upper()
                risk_type_display = (r.get("risk_type") or "Risk").replace("_", " ").title()
                elements.append(Paragraph(
                    f"{sev} — {risk_type_display}",
                    self._severity_style(sev)
                ))
                elements.append(Paragraph(
                    f"<b>Description:</b> {r.get('description', '')}",
                    self.normal_style
                ))

                ev_info = self._resolve_evidence(r, vendor_id_field="vendor_id")
                elements.append(Paragraph("<b>Evidence:</b>", self.bold_style))
                self._add_evidence_block(elements, ev_info)
                elements.append(Spacer(1, 8))

            elements.append(Spacer(1, 12))

        # ── 8. Final Recommendation ───────────────────────────────────────
        elements.append(Paragraph("7. FINAL RECOMMENDATION", self.h1_style))
        elements.append(Paragraph(
            f"<b>Recommended Vendor:</b> {v_map.get(top_vid, 'None')}",
            self.normal_style
        ))
        elements.append(Paragraph(f"<b>Final Score:</b> {top_score}", self.normal_style))
        if alt_vid:
            elements.append(Paragraph(
                f"<b>Best Alternative:</b> {v_map.get(alt_vid, 'None')}",
                self.normal_style
            ))
        elements.append(Spacer(1, 8))
        elements.append(Paragraph("<b>Why this vendor was selected:</b>", self.bold_style))
        elements.append(Paragraph(rec.get("explanation") or "", self.normal_style))
        elements.append(Spacer(1, 8))
        elements.append(Paragraph("<b>Important Trade-offs:</b>", self.bold_style))
        elements.append(Paragraph(rec.get("trade_offs") or "", self.normal_style))
        elements.append(Spacer(1, 24))

        # ── 9. Negotiation Strategy ───────────────────────────────────────
        elements.append(Paragraph("8. NEGOTIATION STRATEGY", self.h1_style))
        neg = data.get("negotiation", [])
        for v in vendors:
            elements.append(Paragraph(f"Vendor: {v['name']}", self.h2_style))
            v_neg = next((n for n in neg if n["vendor_id"] == v["id"]), None)
            if not v_neg:
                elements.append(Paragraph("Negotiation strategy will appear after analysis.", self.normal_style))
                elements.append(Spacer(1, 8))
                continue

            lps = v_neg.get("leverage_points") or []
            if lps:
                elements.append(Paragraph("<b>Leverage Points:</b>", self.bold_style))
                for lp in lps:
                    elements.append(Paragraph(f"- {lp}", self.normal_style))

            cqs = v_neg.get("clarification_questions") or []
            if cqs:
                elements.append(Spacer(1, 4))
                elements.append(Paragraph("<b>Clarification Questions:</b>", self.bold_style))
                for cq in cqs:
                    elements.append(Paragraph(f"- {cq}", self.normal_style))
            elements.append(Spacer(1, 12))

        # ── 10. Decision Methodology ──────────────────────────────────────
        elements.append(PageBreak())
        elements.append(Paragraph("9. DECISION METHODOLOGY", self.h1_style))
        elements.append(Paragraph(
            "The numeric scoring is deterministic — calculated from structured data extracted "
            "from vendor proposals. No LLM call is made during report generation.",
            self.normal_style
        ))
        elements.append(Spacer(1, 5))
        elements.append(Paragraph(
            "<b>Final Score = (Req Score \u00d7 Req%) + (Cost Score \u00d7 Cost%) - (Risk Penalty \u00d7 Risk%)</b>",
            self.bold_style
        ))
        elements.append(Spacer(1, 5))
        elements.append(Paragraph(
            f"Weights used: Requirements {priorities.get('requirements')}%, "
            f"Cost {priorities.get('cost')}%, Risk {priorities.get('risk')}%",
            self.normal_style
        ))
        elements.append(Spacer(1, 24))

        # ── 11. Procurement Alerts ────────────────────────────────────────
        elements.append(Paragraph("10. PROCUREMENT ALERTS", self.h1_style))
        alerts = data.get("alerts", [])
        if not alerts:
            elements.append(Paragraph("No alerts generated.", self.normal_style))
        else:
            for a in alerts:
                sev   = (a.get("severity") or a.get("level") or "info").upper()
                vname = v_map.get(a.get("vendor_id", ""), "General")
                msg   = a.get("message") or ""
                style = self.alert_style if sev in ("HIGH", "CRITICAL", "HIGH PRIORITY") else self.normal_style
                elements.append(Paragraph(f"<b>{sev}:</b> {msg} ({vname})", style))
                elements.append(Spacer(1, 5))

        doc.build(elements)
        buffer.seek(0)
        return buffer
