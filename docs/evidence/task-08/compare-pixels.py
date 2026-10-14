from pathlib import Path
import json
import numpy as np
from PIL import Image

root = Path(__file__).resolve().parent
comparisons = []

def compare(reference, target, label):
    a = np.array(Image.open(reference).convert('RGB'))
    b = np.array(Image.open(target).convert('RGB'))
    row = {'name': label, 'reference': str(reference.relative_to(root.parent)),
           'target': str(target.relative_to(root.parent)), 'referenceShape': list(a.shape),
           'targetShape': list(b.shape)}
    if a.shape != b.shape:
        row['equalDimensions'] = False
    else:
        delta = np.abs(a.astype(np.int16) - b.astype(np.int16))
        changed = np.any(delta != 0, axis=2)
        ys, xs = np.where(changed)
        row.update(equalDimensions=True, differingPixels=int(changed.sum()),
                   maximumChannelDelta=int(delta.max()),
                   boundingBox=[int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())] if len(xs) else None)
    comparisons.append(row)

for reference in sorted(root.glob('reference-*.png')):
    target = root / reference.name.replace('reference-', 'target-', 1)
    if not target.exists():
        raise AssertionError(f'Missing counterpart: {target.name}')
    compare(reference, target, reference.stem.removeprefix('reference-'))

for page in ['homepage', 'about']:
    for width in [390, 1440]:
        name = f'target-full-{page}-{width}.png'
        compare(root.parent / 'task-07' / name, root / name, f'task07-baseline-{page}-{width}')

report = {'method': 'Exact RGB comparison; no masking, tolerance, registration or image modification',
          'comparisons': comparisons}
(root / 'pixel-comparisons.json').write_text(json.dumps(report, indent=2) + '\n')
failed = [r for r in comparisons if not r.get('equalDimensions') or r.get('differingPixels')]
print(f'{len(comparisons)} comparisons; {len(failed)} differ')
for row in failed:
    print(row)
assert not failed
