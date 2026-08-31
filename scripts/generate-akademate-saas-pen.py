#!/usr/bin/env python3
"""Generate design/akademate-saas.pen from live tenant-admin UI, not sketches.

Source of truth:
- AppSidebar.tsx (240 / 80, full tree)
- programacion lista Table + DirectoryStaffIcons
- web/convocatorias Table
- courseTypeConfig funding/modality/campus pills
No ficha Tabs. No Paper. No emoji.
"""

from __future__ import annotations

import json
from pathlib import Path

OUT = Path(__file__).resolve().parents[1] / "design" / "akademate-saas.pen"

C = {
    "canvas": "#F4F4F6",
    "sidebar": "#FAFAFA",
    "card": "#FFFFFF",
    "fg": "#0F1729",
    "muted": "#6B7280",
    "border": "#E5E7EB",
    "primary": "#0066CC",
    "sidebar_fg": "#1B294B",
    "accent": "#EBECF0",
    "success": "#157F3C",
    "red": "#DC2626",
    "emerald": "#059669",
    "blue600": "#2563EB",
    "emerald50": "#ECFDF5",
    "emerald700": "#047857",
    "emerald200": "#A7F3D0",
    "yellow300": "#FDE047",
    "orange600": "#EA580C",
    "green500": "#22C55E",
    "blue500": "#3B82F6",
    "gray400": "#9CA3AF",
    "green50": "#F0FDF4",
    "green700": "#15803D",
    "green200": "#BBF7D0",
}

FONT = "Manrope"
FONT_D = "Poppins"
n = 0


def nid(prefix: str = "n") -> str:
    global n
    n += 1
    return f"{prefix}{n}"


def T(content: str, size: int, fill: str, weight: str = "400", **kw):
    node = {
        "type": "text",
        "id": nid("t"),
        "content": content,
        "fontFamily": FONT,
        "fontSize": size,
        "fontWeight": weight,
        "fill": fill,
        "lineHeight": kw.pop("lineHeight", 1.3),
    }
    node.update(kw)
    return node


def F(name: str | None = None, **kw):
    node = {"type": "frame", "id": nid("f")}
    if name:
        node["name"] = name
    node.update(kw)
    return node


def pill(label: str, bg: str, fg: str, radius: int = 999):
    return F(
        layout="horizontal",
        layoutAlignContent="center",
        layoutCrossAxisAlignment="center",
        padding=[3, 8, 3, 8],
        fill=bg,
        cornerRadius=radius,
        children=[T(label, 10, fg, "600")],
    )


def funding(kind: str):
    m = {
        "privados": (C["red"], "#FFFFFF", "Privados"),
        "ocupados": (C["emerald"], "#FFFFFF", "Ocupados"),
        "desempleados": (C["blue600"], "#FFFFFF", "Desempleados"),
    }
    bg, fg, label = m[kind]
    return pill(label, bg, fg, 8)


def modality(kind: str):
    m = {
        "presencial": (C["emerald50"], C["emerald700"], "Presencial"),
        "mixto": ("#F0FDFA", "#0F766E", "Mixto"),
        "teleformacion": (C["yellow300"], C["orange600"], "Teleformacion"),
    }
    bg, fg, label = m[kind]
    return pill(label, bg, fg, 8)


def campus(name: str):
    return pill(name, C["red"], "#FFFFFF", 8)


def aula(name: str):
    return pill(name, C["accent"], C["fg"], 8)


def status_badge(label: str, bg: str):
    return pill(label, bg, "#FFFFFF", 8)


def staff_stack(initials: list[str], fills: list[str] | None = None):
    fills = fills or ["#DBEAFE", "#DCFCE7", "#FEF3C7", "#FCE7F3"]
    w = 32 + 26 * (len(initials) - 1)
    kids = []
    for i, ini in enumerate(initials):
        kids.append(
            F(
                x=i * 26,
                y=0,
                width=32,
                height=32,
                cornerRadius=999,
                fill=fills[i % len(fills)],
                stroke="#FFFFFF",
                strokeWidth=2,
                layout="vertical",
                layoutAlignContent="center",
                layoutCrossAxisAlignment="center",
                children=[T(ini, 10, C["primary"], "600")],
            )
        )
    return F(
        name="DirectoryStaffIcons",
        layout="none",
        width=w,
        height=32,
        children=kids,
    )


def assign_empty(label: str):
    return F(
        layout="horizontal",
        padding=[4, 8, 4, 8],
        cornerRadius=6,
        stroke=C["border"],
        strokeWidth=1,
        children=[T(label, 11, C["muted"], "500")],
    )


def icon_box(size: int = 20):
    return F(
        width=size,
        height=size,
        cornerRadius=4,
        fill=C["fg"],
        opacity=0.55,
    )


def nav_item(label: str, active: bool = False, collapsed: bool = False, indent: bool = False):
    bg = C["accent"] if active else None
    pad_l = 10 if indent else 12
    row = F(
        layout="horizontal",
        layoutCrossAxisAlignment="center",
        gap=10,
        height=36,
        width=56 if collapsed else (200 if indent else 216),
        padding=[8, 8, 8, pad_l] if not collapsed else [8, 0, 8, 0],
        cornerRadius=6,
        fill=bg,
        layoutAlignContent="center" if collapsed else "start",
        children=[icon_box(16 if indent else 20)]
        + ([] if collapsed else [T(label, 13 if indent else 14, C["sidebar_fg"], "500")]),
    )
    if not collapsed and active and not indent:
        bar = F(
            width=2,
            height=20,
            fill=C["primary"],
            cornerRadius=2,
        )
        return F(
            layout="horizontal",
            layoutCrossAxisAlignment="center",
            gap=0,
            children=[bar, row],
        )
    return row


def section_label(text: str, collapsed: bool = False):
    if collapsed:
        return F(
            layout="horizontal",
            layoutAlignContent="center",
            padding=[16, 0, 4, 0],
            children=[F(width=24, height=1, fill=C["primary"], opacity=0.45)],
        )
    return F(
        padding=[16, 12, 4, 12],
        children=[T(text, 10, C["primary"], "700", letterSpacing=1.6)],
    )


def make_sidebar(active: str, collapsed: bool = False, open_group: str | None = "web"):
    w = 80 if collapsed else 240
    items: list = []

    header_kids = [F(width=32, height=32, cornerRadius=6, fill=C["primary"])]
    if not collapsed:
        header_kids.append(T("CEP FORMACION", 14, C["sidebar_fg"], "700"))
    items.append(
        F(
            name="SidebarHeader",
            layout="horizontal",
            layoutCrossAxisAlignment="center",
            layoutAlignContent="center" if collapsed else "start",
            gap=10,
            height=56,
            width=w,
            padding=[0, 12, 0, 12],
            stroke=C["border"],
            strokeWidth=1,
            children=header_kids,
        )
    )

    def add(*nodes):
        items.extend(nodes)

    add(nav_item("Dashboard", active == "dashboard", collapsed))
    add(section_label("ACADEMICO", collapsed))
    add(nav_item("Programacion", active == "programacion", collapsed))
    add(nav_item("Planner Visual", active == "planner", collapsed))
    add(nav_item("Cursos", active == "cursos", collapsed))
    add(nav_item("Ciclos", active == "ciclos", collapsed))
    add(nav_item("Sedes", active == "sedes", collapsed))
    add(nav_item("Alumnos", active == "alumnos", collapsed))
    add(nav_item("Matriculacion", active == "matriculas" or open_group == "matriculas", collapsed))
    if open_group == "matriculas" or not collapsed:
        if collapsed and open_group == "matriculas":
            add(nav_item("Solicitudes", active == "matriculas", True, True))
        elif not collapsed:
            add(nav_item("Solicitudes", active == "matriculas", False, True))
            add(nav_item("Nueva matricula", False, False, True))
            add(nav_item("Planes y tarifas", False, False, True))
            add(nav_item("Tarifas de acceso", False, False, True))
    add(nav_item("Accesos", active == "accesos", collapsed))
    add(section_label("PERSONAL", collapsed))
    add(nav_item("Personal", active in ("profesores", "personal"), collapsed))
    if not collapsed:
        add(nav_item("Profesores", active == "profesores", False, True))
        add(nav_item("Administrativos", False, False, True))
    add(section_label("CAMPUS VIRTUAL", collapsed))
    add(nav_item("Campus Virtual", active == "campus", collapsed))
    add(section_label("MARKETING", collapsed))
    add(nav_item("Marketing", active in ("campanas", "leads"), collapsed))
    if not collapsed:
        add(nav_item("Campanas", active == "campanas", False, True))
        add(nav_item("Creatividades", False, False, True))
        add(nav_item("Leads", active == "leads", False, True))
        add(nav_item("Inscripciones", False, False, True))
        add(nav_item("Lista de Espera", False, False, True))
        add(nav_item("Calendario citas", False, False, True))
        add(nav_item("Analiticas", False, False, True))
    add(section_label("WEB", collapsed))
    add(nav_item("Web", active.startswith("web") if isinstance(active, str) else False, collapsed))
    if not collapsed:
        add(nav_item("Analiticas", False, False, True))
        add(nav_item("Cursos", active == "web-cursos", False, True))
        add(nav_item("Ciclos", False, False, True))
        add(nav_item("Convocatorias", active == "web-convocatorias", False, True))
        add(nav_item("Noticias/Blog", False, False, True))
        add(nav_item("Paginas", False, False, True))
        add(nav_item("FAQs", False, False, True))
        add(nav_item("Testimonios", False, False, True))
        add(nav_item("Formularios", False, False, True))
        add(nav_item("Medios", False, False, True))
        add(nav_item("Visitantes", False, False, True))
    add(section_label("FINANZAS", collapsed))
    add(nav_item("Finanzas", False, collapsed))
    add(section_label("ADMINISTRACION", collapsed))
    add(nav_item("Administracion", active == "usuarios", collapsed))
    add(section_label("CONFIGURACION", collapsed))
    add(nav_item("Configuracion", active == "config", collapsed))

    footer_kids = [icon_box(16)]
    if not collapsed:
        footer_kids.append(
            F(
                layout="vertical",
                gap=2,
                children=[
                    T("Ayuda y Documentacion", 13, C["muted"], "400"),
                    T("Guias y soporte tecnico", 11, C["muted"], "400"),
                ],
            )
        )
    items.append(
        F(
            name="SidebarFooter",
            layout="horizontal",
            layoutCrossAxisAlignment="center",
            layoutAlignContent="center" if collapsed else "start",
            gap=12,
            height=48,
            width=w,
            padding=[0, 12, 0, 12],
            stroke=C["border"],
            strokeWidth=1,
            children=footer_kids,
        )
    )

    return F(
        name="AppSidebar collapsed 80" if collapsed else "AppSidebar expanded 240",
        layout="vertical",
        width=w,
        fill=C["sidebar"],
        stroke=C["border"],
        strokeWidth=1,
        children=items,
    )


def header_bar(width: int = 1200):
    return F(
        name="DashboardHeader",
        layout="horizontal",
        layoutAlignContent="space-between",
        layoutCrossAxisAlignment="center",
        height=56,
        width=width,
        fill=C["card"],
        padding=[0, 24, 0, 16],
        stroke=C["border"],
        strokeWidth=1,
        children=[
            F(width=32, height=32, cornerRadius=6, fill=C["accent"], children=[]),
            F(
                layout="horizontal",
                layoutCrossAxisAlignment="center",
                gap=8,
                children=[
                    F(width=32, height=32, cornerRadius=6, fill=C["accent"]),
                    F(width=32, height=32, cornerRadius=6, fill=C["accent"]),
                    F(
                        width=32,
                        height=32,
                        cornerRadius=999,
                        fill=C["primary"],
                        layout="vertical",
                        layoutAlignContent="center",
                        layoutCrossAxisAlignment="center",
                        children=[T("AD", 11, "#FFFFFF", "600")],
                    ),
                ],
            ),
        ],
    )


def page_header(title: str, desc: str, cta: str | None, extra=None):
    actions = extra or []
    if cta:
        actions.append(
            F(
                layout="horizontal",
                layoutCrossAxisAlignment="center",
                padding=[8, 14, 8, 14],
                fill=C["primary"],
                cornerRadius=8,
                children=[T(cta, 13, "#FFFFFF", "600")],
            )
        )
    return F(
        name="PageHeader",
        layout="horizontal",
        layoutAlignContent="space-between",
        layoutCrossAxisAlignment="start",
        width=1144,
        children=[
            F(
                layout="vertical",
                gap=4,
                children=[
                    T(title, 18, C["fg"], "600"),
                    T(desc, 14, C["muted"], "400", textGrowth="fixed-width", width=640),
                ],
            ),
            F(layout="horizontal", gap=8, layoutCrossAxisAlignment="center", children=actions),
        ],
    )


def kpi_row(items: list[tuple[str, str]]):
    cards = []
    w = int((1144 - 12 * (len(items) - 1)) / len(items))
    for label, value in items:
        cards.append(
            F(
                layout="vertical",
                gap=4,
                width=w,
                padding=[12, 16, 12, 16],
                fill=C["card"],
                stroke=C["border"],
                strokeWidth=1,
                cornerRadius=8,
                children=[
                    T(label, 11, C["muted"], "400"),
                    T(value, 22, C["fg"], "600"),
                ],
            )
        )
    return F(name="ListingKpiStrip", layout="horizontal", gap=12, children=cards)


def segmented(options: list[str], active: str):
    kids = []
    for opt in options:
        on = opt == active
        kids.append(
            F(
                layout="horizontal",
                padding=[6, 12, 6, 12],
                cornerRadius=6,
                fill=C["card"] if on else None,
                children=[T(opt, 13, C["fg"] if on else C["muted"], "600" if on else "500")],
            )
        )
    return F(
        name="SegmentedToggle",
        layout="horizontal",
        gap=4,
        padding=4,
        fill=C["accent"],
        cornerRadius=8,
        children=kids,
    )


def table_head(cols: list[tuple[str, int]]):
    return F(
        name="TableHeader",
        layout="horizontal",
        layoutCrossAxisAlignment="center",
        height=40,
        fill="#F9FAFB",
        padding=[0, 12, 0, 12],
        children=[
            F(width=w, children=[T(label, 12, C["muted"], "600")]) for label, w in cols
        ],
    )


def plazas_cell(ocup: int, total: int):
    pct = int(ocup / total * 100) if total else 0
    bar_c = C["red"] if pct >= 90 else ("#F59E0B" if pct >= 70 else C["green500"])
    return F(
        layout="vertical",
        gap=4,
        width=88,
        children=[
            T(f"{ocup}/{total}", 13, C["fg"], "500"),
            F(
                width=72,
                height=4,
                cornerRadius=999,
                fill=C["accent"],
                children=[F(width=int(72 * pct / 100), height=4, cornerRadius=999, fill=bar_c)],
            ),
        ],
    )


def prog_row(
    title: str,
    fund: str,
    mod: str,
    sede: str | None,
    teachers: list[str] | None,
    aula_name: str | None,
    fechas: str,
    ocup: int,
    total: int,
    estado: tuple[str, str],
):
    docente = staff_stack(teachers) if teachers else assign_empty("Asignar docente")
    sede_n = campus(sede) if sede else assign_empty("Asignar sede")
    aula_n = aula(aula_name) if aula_name else assign_empty("Asignar aula")
    return F(
        layout="horizontal",
        layoutCrossAxisAlignment="center",
        height=72,
        padding=[8, 12, 8, 12],
        stroke=C["border"],
        strokeWidth=1,
        fill=C["card"],
        children=[
            F(
                width=260,
                layout="vertical",
                gap=6,
                children=[
                    T(title, 14, C["fg"], "500", textGrowth="fixed-width", width=248),
                    F(layout="horizontal", gap=6, children=[funding(fund), modality(mod)]),
                ],
            ),
            F(width=150, children=[sede_n]),
            F(width=140, children=[docente]),
            F(width=110, children=[aula_n]),
            F(width=140, children=[T(fechas, 13, C["muted"], "400")]),
            F(width=90, children=[plazas_cell(ocup, total)]),
            F(width=140, layoutAlignContent="center", children=[status_badge(*estado)]),
        ],
    )


def web_row(
    title: str,
    sede: str,
    teachers: list[str] | None,
    fechas: str,
    ocup: int,
    total: int,
    estado: str,
    camp: str,
    published: bool,
):
    docente = staff_stack(teachers) if teachers else assign_empty("Asignar docente")
    switch = F(
        width=36,
        height=20,
        cornerRadius=999,
        fill=C["primary"] if published else C["accent"],
        layout="none",
        children=[
            F(
                x=18 if published else 2,
                y=2,
                width=16,
                height=16,
                cornerRadius=999,
                fill="#FFFFFF",
            )
        ],
    )
    return F(
        layout="horizontal",
        layoutCrossAxisAlignment="center",
        height=64,
        padding=[8, 12, 8, 12],
        stroke=C["border"],
        strokeWidth=1,
        fill=C["card"],
        children=[
            F(width=200, children=[T(title, 13, C["fg"], "500", textGrowth="fixed-width", width=190)]),
            F(width=140, children=[campus(sede)]),
            F(width=130, children=[docente]),
            F(width=150, children=[T(fechas, 12, C["muted"], "400")]),
            F(width=70, children=[T(f"{ocup}/{total}", 13, C["fg"], "500")]),
            F(width=110, children=[status_badge(estado, C["green500"])]),
            F(
                width=150,
                children=[
                    F(
                        layout="horizontal",
                        layoutCrossAxisAlignment="center",
                        gap=6,
                        padding=[4, 8, 4, 8],
                        fill=C["green50"],
                        stroke=C["green200"],
                        strokeWidth=1,
                        cornerRadius=6,
                        children=[
                            F(width=8, height=8, cornerRadius=999, fill=C["green500"]),
                            T(camp, 11, C["green700"], "500"),
                        ],
                    )
                ],
            ),
            F(width=70, children=[switch]),
            F(width=70, children=[T("Editar", 12, C["primary"], "500")]),
        ],
    )


def list_course_item(title: str, fund: str, area: str, mod: str, hours: str, convs: str):
    return F(
        name="CourseListItem",
        layout="horizontal",
        layoutCrossAxisAlignment="center",
        gap=12,
        padding=16,
        fill=C["card"],
        stroke=C["border"],
        strokeWidth=1,
        cornerRadius=8,
        width=1144,
        children=[
            F(
                width=48,
                height=48,
                cornerRadius=8,
                fill=C["accent"],
                layout="vertical",
                layoutAlignContent="center",
                layoutCrossAxisAlignment="center",
                children=[T("C", 14, C["muted"], "600")],
            ),
            F(
                layout="vertical",
                gap=6,
                children=[
                    T(title, 14, C["fg"], "600"),
                    F(
                        layout="horizontal",
                        gap=6,
                        children=[
                            funding(fund),
                            pill(area, "#FFE4E6", "#9F1239", 8),
                            modality(mod),
                        ],
                    ),
                ],
            ),
            F(layout="horizontal", gap=16, children=[T(hours, 13, C["muted"], "400"), T(convs, 13, C["muted"], "400")]),
            F(
                layout="horizontal",
                padding=[6, 12, 6, 12],
                fill=C["primary"],
                cornerRadius=6,
                children=[T("Abrir", 13, "#FFFFFF", "500")],
            ),
        ],
    )


def page_shell(name: str, x: int, y: int, h: int, active: str, main: list, collapsed: bool = False):
    sb = make_sidebar(active, collapsed=collapsed)
    inner_w = 1440 - (80 if collapsed else 240)
    return F(
        name=name,
        x=x,
        y=y,
        width=1440,
        height=h,
        fill=C["canvas"],
        layout="horizontal",
        clip=True,
        children=[
            sb,
            F(
                layout="vertical",
                width=inner_w,
                children=[header_bar(inner_w)]
                + [
                    F(
                        layout="vertical",
                        gap=16,
                        padding=24,
                        width=inner_w,
                        children=main,
                    )
                ],
            ),
        ],
    )


def artboard_sidebar_only(name: str, x: int, y: int, collapsed: bool):
    sb = make_sidebar("programacion" if not collapsed else "web-convocatorias", collapsed=collapsed)
    w = 80 if collapsed else 240
    return F(
        name=name,
        x=x,
        y=y,
        width=w,
        fill=C["sidebar"],
        layout="vertical",
        children=sb["children"],
    )


def main_programacion():
    cols = [
        ("Curso / ciclo", 260),
        ("Sede", 150),
        ("Docente", 140),
        ("Aula", 110),
        ("Fechas", 140),
        ("Plazas", 90),
        ("Estado", 140),
    ]
    return [
        page_header(
            "Programacion Academica",
            "Calendario de convocatorias, horarios y ocupacion",
            "Nueva Convocatoria",
        ),
        kpi_row(
            [
                ("Convocatorias", "12"),
                ("Activas", "7"),
                ("Plazas totales", "280"),
                ("Ocupacion", "64%"),
            ]
        ),
        F(
            layout="horizontal",
            layoutAlignContent="space-between",
            layoutCrossAxisAlignment="center",
            width=1144,
            children=[
                segmented(["Anual", "Mes", "Semana", "Dia", "Lista"], "Lista"),
                F(
                    layout="horizontal",
                    gap=8,
                    layoutCrossAxisAlignment="center",
                    children=[
                        T("Sep 2026", 13, C["fg"], "500"),
                        F(
                            layout="horizontal",
                            padding=[6, 10, 6, 10],
                            stroke=C["border"],
                            strokeWidth=1,
                            cornerRadius=6,
                            fill=C["card"],
                            children=[T("Todas las sedes", 13, C["fg"], "400")],
                        ),
                    ],
                ),
            ],
        ),
        F(
            name="ProgramacionTable",
            layout="vertical",
            width=1144,
            fill=C["card"],
            stroke=C["border"],
            strokeWidth=1,
            cornerRadius=8,
            clip=True,
            children=[
                table_head(cols),
                prog_row(
                    "Nutricosmetica avanzada aplicada a cabina",
                    "privados",
                    "presencial",
                    "Madrid Centro",
                    ["LM", "CR", "AP"],
                    "Aula 3",
                    "15 sep - 20 dic 26",
                    18,
                    25,
                    ("Inscripcion abierta", C["green500"]),
                ),
                prog_row(
                    "Dietetica y nutricion clinica",
                    "ocupados",
                    "mixto",
                    "Las Palmas",
                    ["MG", "SR"],
                    "Aula 1",
                    "01 oct - 15 mar 27",
                    22,
                    25,
                    ("En curso", C["blue500"]),
                ),
                prog_row(
                    "Estetica integral y bienestar",
                    "desempleados",
                    "teleformacion",
                    None,
                    None,
                    None,
                    "Pendiente",
                    0,
                    30,
                    ("Borrador", C["gray400"]),
                ),
            ],
        ),
    ]


def main_web_conv():
    cols = [
        ("Ciclo / curso", 200),
        ("Sede", 140),
        ("Docente", 130),
        ("Fechas", 150),
        ("Plazas", 70),
        ("Estado", 110),
        ("Campana", 150),
        ("Publicada", 70),
        ("Acciones", 70),
    ]
    return [
        page_header(
            "Gestion Web — Convocatorias",
            "Publicacion de convocatorias en la web de la academia",
            None,
        ),
        segmented(["Todas", "Publicadas", "Borrador"], "Todas"),
        F(
            name="WebConvocatoriasTable",
            layout="vertical",
            width=1144,
            fill=C["card"],
            stroke=C["border"],
            strokeWidth=1,
            cornerRadius=8,
            clip=True,
            children=[
                table_head(cols),
                web_row(
                    "Nutricosmetica avanzada",
                    "Madrid Centro",
                    ["LM", "CR", "AP"],
                    "15/09/2026 - 20/12/2026",
                    18,
                    25,
                    "Abierta",
                    "Campana activa",
                    True,
                ),
                web_row(
                    "CFGS Estetica integral",
                    "Las Palmas",
                    ["MG"],
                    "01/10/2026 - 30/06/2027",
                    12,
                    20,
                    "Abierta",
                    "Campana activa",
                    True,
                ),
                web_row(
                    "Masaje terapeutico",
                    "Tenerife",
                    None,
                    "Pendiente",
                    0,
                    15,
                    "Borrador",
                    "Sin campana",
                    False,
                ),
            ],
        ),
    ]


def main_cursos():
    return [
        page_header("Catalogo de cursos", "Plantillas, publicacion e imagen de curso", "Nuevo Curso"),
        kpi_row([("Plantillas", "24"), ("Publicados", "18"), ("Sin imagen", "3"), ("Tipos", "3")]),
        F(
            layout="horizontal",
            layoutAlignContent="space-between",
            width=1144,
            children=[
                segmented(["Todos", "Privados", "Ocupados", "Desempleados"], "Todos"),
                segmented(["Lista", "Grid"], "Lista"),
            ],
        ),
        list_course_item(
            "Nutricosmetica avanzada aplicada a cabina",
            "privados",
            "Estetica",
            "presencial",
            "240 h",
            "3 convocatorias",
        ),
        list_course_item(
            "Dietetica y nutricion clinica",
            "ocupados",
            "Salud",
            "mixto",
            "180 h",
            "1 convocatoria",
        ),
        list_course_item(
            "Protocolo de cabina y venta cruzada",
            "desempleados",
            "Estetica",
            "teleformacion",
            "Pendiente",
            "0 convocatorias",
        ),
    ]


def main_ciclo_ficha():
    """No Tabs. Stacked sections from ciclos/[id] content."""
    conv_table = F(
        layout="vertical",
        width=1144,
        fill=C["card"],
        stroke=C["border"],
        strokeWidth=1,
        cornerRadius=8,
        children=[
            table_head(
                [
                    ("Convocatoria", 260),
                    ("Sede", 150),
                    ("Docentes", 160),
                    ("Fechas", 180),
                    ("Plazas", 90),
                    ("Estado", 140),
                ]
            ),
            F(
                layout="horizontal",
                layoutCrossAxisAlignment="center",
                height=64,
                padding=[8, 12, 8, 12],
                children=[
                    F(width=260, children=[T("2026-01 Madrid", 14, C["fg"], "500")]),
                    F(width=150, children=[campus("Madrid Centro")]),
                    F(width=160, children=[staff_stack(["LM", "CR", "AP"])]),
                    F(width=180, children=[T("15 sep 26 - 20 jun 27", 13, C["muted"])]),
                    F(width=90, children=[plazas_cell(18, 25)]),
                    F(width=140, children=[status_badge("Inscripcion abierta", C["green500"])]),
                ],
            ),
        ],
    )
    staff_row = F(
        layout="horizontal",
        gap=12,
        children=[
            staff_stack(["LM"]),
            F(
                layout="vertical",
                gap=2,
                children=[
                    T("Laura Mendez", 14, C["fg"], "600"),
                    T("Coordinadora de estetica · laura@cep.es", 12, C["muted"], "400"),
                ],
            ),
        ],
    )
    return [
        page_header("CFGS Estetica integral y bienestar", "Grado superior · 2000 h · 2 cursos", "Editar ciclo"),
        kpi_row([("Convocatorias", "4"), ("Alumnos", "62"), ("Ocupacion", "71%"), ("Modulos", "14")]),
        T("Convocatorias", 16, C["fg"], "600"),
        conv_table,
        T("Profesores asignados", 16, C["fg"], "600"),
        F(
            layout="vertical",
            gap=12,
            padding=16,
            fill=C["card"],
            stroke=C["border"],
            strokeWidth=1,
            cornerRadius=8,
            width=1144,
            children=[
                staff_row,
                F(
                    layout="horizontal",
                    gap=12,
                    children=[
                        staff_stack(["CR"]),
                        F(
                            layout="vertical",
                            gap=2,
                            children=[
                                T("Carlos Ruiz", 14, C["fg"], "600"),
                                T("Docente · carlos.ruiz@cep.es", 12, C["muted"], "400"),
                            ],
                        ),
                    ],
                ),
            ],
        ),
        T("Alumnos", 16, C["fg"], "600"),
        F(
            layout="vertical",
            width=1144,
            fill=C["card"],
            stroke=C["border"],
            strokeWidth=1,
            cornerRadius=8,
            children=[
                table_head([("Alumno", 280), ("Email", 280), ("Estado", 140), ("Matricula", 140)]),
                F(
                    layout="horizontal",
                    height=48,
                    padding=[8, 12, 8, 12],
                    layoutCrossAxisAlignment="center",
                    children=[
                        F(width=280, children=[T("Ana Ruiz", 14, C["fg"], "500")]),
                        F(width=280, children=[T("ana.ruiz@mail.es", 13, C["muted"])]),
                        F(width=140, children=[status_badge("Activo", C["green500"])]),
                        F(width=140, children=[T("MAT-2026-014", 13, C["muted"])]),
                    ],
                ),
            ],
        ),
        T("Documentos", 16, C["fg"], "600"),
        F(
            padding=16,
            fill=C["card"],
            stroke=C["border"],
            strokeWidth=1,
            cornerRadius=8,
            width=1144,
            children=[T("Guia del ciclo.pdf · Programacion didactica.docx", 13, C["muted"], "400")],
        ),
    ]


def main_dashboard():
    return [
        page_header("Dashboard", "Resumen operativo de la academia", None),
        kpi_row(
            [
                ("Alumnos activos", "184"),
                ("Convocatorias", "12"),
                ("Leads abiertos", "41"),
                ("Ocupacion media", "64%"),
            ]
        ),
        F(
            layout="horizontal",
            gap=16,
            children=[
                F(
                    width=740,
                    height=220,
                    fill=C["card"],
                    stroke=C["border"],
                    strokeWidth=1,
                    cornerRadius=8,
                    padding=16,
                    layout="vertical",
                    gap=8,
                    children=[
                        T("Matriculas 30 dias", 14, C["fg"], "600"),
                        F(width=700, height=140, fill=C["accent"], cornerRadius=6),
                    ],
                ),
                F(
                    width=388,
                    height=220,
                    fill=C["card"],
                    stroke=C["border"],
                    strokeWidth=1,
                    cornerRadius=8,
                    padding=16,
                    layout="vertical",
                    gap=8,
                    children=[
                        T("Proximas convocatorias", 14, C["fg"], "600"),
                        T("Nutricosmetica · 15 sep · LM CR AP", 13, C["muted"], "400"),
                        T("Dietetica · 01 oct · MG SR", 13, C["muted"], "400"),
                    ],
                ),
            ],
        ),
    ]


def main_matriculas():
    cols = [
        ("Alumno", 180),
        ("Curso/Ciclo", 220),
        ("Convocatoria", 160),
        ("Metodo Pago", 120),
        ("Importe", 90),
        ("Docs", 70),
        ("Estado", 120),
        ("Acciones", 90),
    ]
    def row(name, course, conv, pay, amount, docs, st, stc):
        return F(
            layout="horizontal",
            layoutCrossAxisAlignment="center",
            height=52,
            padding=[8, 12, 8, 12],
            stroke=C["border"],
            strokeWidth=1,
            children=[
                F(width=180, children=[T(name, 13, C["fg"], "500")]),
                F(width=220, children=[T(course, 13, C["fg"], "400", textGrowth="fixed-width", width=210)]),
                F(width=160, children=[T(conv, 12, C["muted"])]),
                F(width=120, children=[T(pay, 12, C["muted"])]),
                F(width=90, children=[T(amount, 13, C["fg"], "600")]),
                F(width=70, children=[T(docs, 12, C["muted"])]),
                F(width=120, children=[status_badge(st, stc)]),
                F(width=90, children=[T("Ver", 12, C["primary"], "500")]),
            ],
        )
    return [
        page_header("Matriculas", "Solicitudes, importacion y estados de documentacion", "Nueva Matricula"),
        F(
            name="MatriculasTable",
            layout="vertical",
            width=1144,
            fill=C["card"],
            stroke=C["border"],
            strokeWidth=1,
            cornerRadius=8,
            children=[
                table_head(cols),
                row("Ana Ruiz", "Nutricosmetica avanzada", "PRIV-NUTRI-01", "Transferencia", "712 €", "3/4", "En revision", "#F59E0B"),
                row("Luis Ortega", "CFGS Estetica", "CIC-EST-26", "SEPE", "0 €", "4/4", "Confirmada", C["green500"]),
            ],
        ),
    ]


def main_ciclos():
    def row(title, nivel, convs, plazas, occ):
        return F(
            name="CicloListItem",
            layout="horizontal",
            layoutCrossAxisAlignment="center",
            gap=16,
            padding=16,
            width=1144,
            fill=C["card"],
            stroke=C["border"],
            strokeWidth=1,
            cornerRadius=8,
            children=[
                F(width=64, height=64, cornerRadius=8, fill=C["accent"]),
                F(
                    layout="vertical",
                    gap=4,
                    children=[
                        T(title, 14, C["fg"], "600"),
                        pill(nivel, "#F1F5F9", "#475569", 8),
                    ],
                ),
                T(f"{convs} convocatorias", 13, C["muted"], "400"),
                T(f"{plazas} plazas", 13, C["muted"], "400"),
                pill(occ, C["emerald50"], C["emerald700"], 8),
            ],
        )

    return [
        page_header("Ciclos formativos", "Catalogo oficial de ciclos y ocupacion", "Nuevo Ciclo"),
        kpi_row([("Ciclos", "8"), ("Convocatorias", "14"), ("Plazas", "240"), ("Ocupacion", "68%")]),
        row("CFGS Estetica integral y bienestar", "Grado superior", 4, 80, "71%"),
        row("CFGM Estetica y belleza", "Grado medio", 2, 40, "55%"),
    ]


def main_sedes():
    def row(name, addr, aulas, cap):
        return F(
            name="SedeListItem",
            layout="horizontal",
            layoutCrossAxisAlignment="center",
            gap=16,
            padding=16,
            width=1144,
            fill=C["card"],
            stroke=C["border"],
            strokeWidth=1,
            cornerRadius=8,
            children=[
                F(width=64, height=64, cornerRadius=8, fill=C["accent"]),
                F(
                    layout="vertical",
                    gap=4,
                    children=[
                        T(name, 14, C["fg"], "600"),
                        T(addr, 12, C["muted"], "400"),
                    ],
                ),
                T(f"{aulas} aulas", 13, C["muted"], "400"),
                T(f"{cap} plazas", 13, C["muted"], "400"),
            ],
        )

    return [
        page_header("Sedes", "Campus, aulas y capacidad", "Nueva Sede"),
        kpi_row([("Sedes", "3"), ("Aulas", "14"), ("Plazas", "420"), ("Docentes", "18")]),
        row("Madrid Centro", "C/ Alcala 120 · 91 000 00 00", 6, 180),
        row("Las Palmas", "Av. Mesa y Lopez 12", 5, 140),
    ]


def main_campanas():
    cols = [
        ("Nombre de campana", 260),
        ("Ad Account", 180),
        ("Gasto total", 120),
        ("Leads", 90),
        ("Fechas", 200),
        ("Acciones", 90),
    ]

    def row(name, acc, spend, leads, dates):
        return F(
            layout="horizontal",
            layoutCrossAxisAlignment="center",
            height=52,
            padding=[8, 12, 8, 12],
            stroke=C["border"],
            strokeWidth=1,
            children=[
                F(width=260, children=[T(name, 13, C["fg"], "500")]),
                F(width=180, children=[T(acc, 12, C["muted"])]),
                F(width=120, children=[T(spend, 13, C["fg"], "600")]),
                F(width=90, children=[T(leads, 13, C["fg"], "500")]),
                F(width=200, children=[T(dates, 12, C["muted"])]),
                F(width=90, children=[T("Abrir", 12, C["primary"], "500")]),
            ],
        )

    return [
        page_header("Campanas de Marketing", "Sincronizacion Meta y resultados", None),
        kpi_row([("Campanas", "6"), ("Gasto", "4.210 €"), ("Leads", "128")]),
        F(
            layout="vertical",
            width=1144,
            fill=C["card"],
            stroke=C["border"],
            strokeWidth=1,
            cornerRadius=8,
            children=[
                table_head(cols),
                row("Nutricosmetica sept 26", "CEP Formacion Ads", "1.240 €", "34", "01/09 - 30/09"),
                row("Ciclos FP Canarias", "CEP Formacion Ads", "890 €", "21", "15/08 - 15/10"),
            ],
        ),
    ]


def main_profesores():
    def person(name, role, specs, status):
        ini = "".join(p[0] for p in name.split()[:2]).upper()
        return F(
            name="PersonalListItem",
            layout="horizontal",
            layoutCrossAxisAlignment="center",
            gap=16,
            padding=16,
            width=1144,
            fill=C["card"],
            stroke=C["border"],
            strokeWidth=1,
            cornerRadius=8,
            children=[
                F(
                    width=80,
                    height=80,
                    cornerRadius=8,
                    fill="#DBEAFE",
                    layout="vertical",
                    layoutAlignContent="center",
                    layoutCrossAxisAlignment="center",
                    children=[T(ini, 18, C["primary"], "600")],
                ),
                F(
                    layout="vertical",
                    gap=6,
                    children=[
                        T(name, 16, C["fg"], "600"),
                        T(role, 13, C["muted"], "400"),
                        F(layout="horizontal", gap=6, children=[pill(s, "#F3F4F6", C["fg"], 8) for s in specs]),
                    ],
                ),
                status_badge(status, C["green500"]),
            ],
        )
    return [
        page_header("Profesores", "Directorio docente y asignacion a convocatorias", "Nuevo Profesor"),
        kpi_row([("Profesores", "18"), ("Activos", "16"), ("Inactivos", "2"), ("Convocatorias", "24")]),
        person("Laura Mendez", "Coordinadora de estetica", ["Nutricosmetica", "Cabina"], "ACTIVO"),
        person("Carlos Ruiz", "Docente", ["Dietetica", "Salud"], "ACTIVO"),
        person("Ana Pardo", "Docente", ["Masaje"], "ACTIVO"),
    ]


children = [
    artboard_sidebar_only("08 Sidebar expanded 240", 0, 0, False),
    artboard_sidebar_only("09 Sidebar collapsed 80", 320, 0, True),
    page_shell("10 Programacion lista", 480, 0, 1100, "programacion", main_programacion()),
    page_shell("11 Web convocatorias", 2000, 0, 980, "web-convocatorias", main_web_conv()),
    page_shell("12 Cursos catalogo", 3520, 0, 1020, "cursos", main_cursos()),
    page_shell("13 Ciclo ficha stacked", 5040, 0, 1400, "ciclos", main_ciclo_ficha()),
    page_shell("14 Dashboard", 6560, 0, 780, "dashboard", main_dashboard()),
    page_shell("15 Matriculas", 8080, 0, 720, "matriculas", main_matriculas()),
    page_shell("16 Profesores", 9600, 0, 980, "profesores", main_profesores()),
    page_shell("10b Programacion collapsed", 480, 1220, 1100, "programacion", main_programacion(), collapsed=True),
    page_shell("17 Ciclos listing", 2000, 1220, 720, "ciclos", main_ciclos()),
    page_shell("18 Sedes listing", 3520, 1220, 720, "sedes", main_sedes()),
    page_shell("19 Campanas", 5040, 1480, 720, "campanas", main_campanas()),
]

doc = {"version": "2.17", "children": children}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(doc, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"wrote {OUT} nodes={n} bytes={OUT.stat().st_size}")
