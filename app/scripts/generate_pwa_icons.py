from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / "public"

BG = "#20317E"
BG_GLOW = "#3150C8"
BOARD = "#F7F0E6"
BOARD_SHADOW = "#122052"
GRID = "#22357B"
GOLD = "#F1B329"
GOLD_SOFT = "#FFD768"
CHECK = "#FFF9F0"


def rounded_rectangle_mask(size: int, radius: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((0, 0, size, size), radius=radius, fill=255)
    return mask


def paint_background(draw: ImageDraw.ImageDraw, size: int) -> None:
    draw.rectangle((0, 0, size, size), fill=BG)


def add_glow(base: Image.Image, size: int) -> None:
    glow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(glow)
    draw.ellipse((120, 110, size - 110, size - 150), fill=BG_GLOW + "55")
    draw.ellipse((260, -10, size - 180, 420), fill=GOLD + "20")
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    base.alpha_composite(glow)


def add_board(base: Image.Image, size: int, safe_padding: int) -> None:
    board_size = size - safe_padding * 2
    board_x = (size - board_size) // 2
    board_y = (size - board_size) // 2 - size // 18
    shadow = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        (board_x, board_y + size // 40, board_x + board_size, board_y + board_size + size // 40),
        radius=size // 10,
        fill=BOARD_SHADOW + "5C",
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(size // 28))
    base.alpha_composite(shadow)

    draw = ImageDraw.Draw(base)
    draw.rounded_rectangle(
        (board_x, board_y, board_x + board_size, board_y + board_size),
        radius=size // 10,
        fill=BOARD,
    )

    inner_pad = board_size * 0.12
    grid_left = board_x + inner_pad
    grid_top = board_y + inner_pad
    grid_right = board_x + board_size - inner_pad
    grid_bottom = board_y + board_size - inner_pad
    cell = (grid_right - grid_left) / 4

    highlighted = {(0, 1), (1, 2), (2, 1), (3, 0)}
    for row in range(4):
        for col in range(4):
            x0 = grid_left + col * cell + cell * 0.06
            y0 = grid_top + row * cell + cell * 0.06
            x1 = grid_left + (col + 1) * cell - cell * 0.06
            y1 = grid_top + (row + 1) * cell - cell * 0.06
            if (row, col) in highlighted:
                draw.rounded_rectangle((x0, y0, x1, y1), radius=cell * 0.16, fill=GOLD)
            else:
                draw.rounded_rectangle((x0, y0, x1, y1), radius=cell * 0.16, fill="#FFFDF8")

    line_width = max(6, size // 75)
    for i in range(5):
        x = grid_left + i * cell
        y = grid_top + i * cell
        draw.line((x, grid_top, x, grid_bottom), fill=GRID, width=line_width)
        draw.line((grid_left, y, grid_right, y), fill=GRID, width=line_width)

    token_r = size * 0.14
    token_cx = board_x + board_size * 0.76
    token_cy = board_y + board_size * 0.76
    draw.ellipse(
        (token_cx - token_r, token_cy - token_r, token_cx + token_r, token_cy + token_r),
        fill=GOLD_SOFT,
    )
    draw.ellipse(
        (token_cx - token_r * 0.82, token_cy - token_r * 0.82, token_cx + token_r * 0.82, token_cy + token_r * 0.82),
        fill=GOLD,
    )
    check_width = max(12, size // 45)
    draw.line(
        (
            token_cx - token_r * 0.34,
            token_cy + token_r * 0.03,
            token_cx - token_r * 0.08,
            token_cy + token_r * 0.28,
            token_cx + token_r * 0.35,
            token_cy - token_r * 0.22,
        ),
        fill=CHECK,
        width=check_width,
        joint="curve",
    )

    sparkle = size * 0.05
    sx = board_x + board_size * 0.23
    sy = board_y + board_size * 0.18
    draw.line((sx - sparkle, sy, sx + sparkle, sy), fill=GOLD, width=max(6, size // 90))
    draw.line((sx, sy - sparkle, sx, sy + sparkle), fill=GOLD, width=max(6, size // 90))


def build_icon(size: int, safe_padding: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    paint_background(ImageDraw.Draw(image), size)
    add_glow(image, size)
    add_board(image, size, safe_padding)
    return image


def save_masked_png(source: Image.Image, size: int, radius: int, path: Path) -> None:
    resized = source.resize((size, size), Image.Resampling.LANCZOS)
    mask = rounded_rectangle_mask(size, radius)
    output = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    output.paste(resized, (0, 0), mask)
    output.save(path)


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)

    standard = build_icon(1024, 180)
    maskable = build_icon(1024, 100)

    save_masked_png(standard, 512, 118, PUBLIC / "icon-512x512.png")
    save_masked_png(standard, 192, 44, PUBLIC / "icon-192x192.png")
    save_masked_png(standard, 180, 42, PUBLIC / "apple-icon.png")
    save_masked_png(standard, 32, 7, PUBLIC / "favicon.png")

    save_masked_png(maskable, 512, 118, PUBLIC / "icon-512x512-maskable.png")
    save_masked_png(maskable, 192, 44, PUBLIC / "icon-192x192-maskable.png")

    favicon = standard.resize((64, 64), Image.Resampling.LANCZOS)
    favicon.save(ROOT / "src" / "app" / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
    favicon.save(ROOT / "src" / "app" / "favicon.png")


if __name__ == "__main__":
    main()
