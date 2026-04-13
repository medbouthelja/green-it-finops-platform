"""Assemble UML diagram PNGs into a single PDF (requires Pillow)."""
from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image

DEFAULT_PATTERNS = [
    "*CAS_GERER_ENTREPRISE*.png",
    "*CAS_GERER_UTILISATEUR*.png",
    "*CASGLOBALE*.png",
    "*CLASSE*.png",
]


def resolve_paths(assets_dir: Path, patterns: list[str]) -> list[Path]:
    out: list[Path] = []
    for pat in patterns:
        matches = sorted(assets_dir.glob(pat))
        if not matches:
            raise FileNotFoundError(f"Aucune image pour le motif {pat!r} dans {assets_dir}")
        out.append(matches[0])
    return out


def main() -> None:
    root = Path(__file__).resolve().parent.parent
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--assets-dir",
        type=Path,
        default=root / "docs" / "uml-images",
        help="Dossier contenant les PNG (par défaut: docs/uml-images)",
    )
    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=root / "docs" / "UML_Plateforme_GreenIT_FinOps.pdf",
        help="Fichier PDF de sortie",
    )
    args = parser.parse_args()
    assets_dir = args.assets_dir.resolve()
    if not assets_dir.is_dir():
        raise SystemExit(f"Dossier introuvable: {assets_dir}")

    paths = resolve_paths(assets_dir, DEFAULT_PATTERNS)
    images = [Image.open(p).convert("RGB") for p in paths]
    out = args.output.resolve()
    out.parent.mkdir(parents=True, exist_ok=True)
    try:
        images[0].save(out, "PDF", resolution=100.0, save_all=True, append_images=images[1:])
    finally:
        for im in images:
            im.close()
    print(out)


if __name__ == "__main__":
    main()
