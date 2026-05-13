import sys
import urllib.error
import urllib.request

URL = (
    "https://www.random.org/integers/"
    "?num=1&min=0&max=1&col=1&base=10&format=plain&rnd=new"
)


def main() -> None:
    try:
        with urllib.request.urlopen(URL, timeout=10) as resp:
            body = resp.read().decode().strip()
        n = int(body.split()[0])
    except (OSError, ValueError, IndexError) as e:
        print(f"flip: could not get random value: {e}", file=sys.stderr)
        sys.exit(1)

    if n not in (0, 1):
        print(f"flip: unexpected value {n!r}", file=sys.stderr)
        sys.exit(1)

    print("heads" if n == 0 else "tails")


if __name__ == "__main__":
    main()
