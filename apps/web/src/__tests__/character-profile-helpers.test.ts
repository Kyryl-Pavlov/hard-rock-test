import type { Episode } from '@rme/shared';
import {
  characterPath,
  describePlace,
  describeSeasons,
  formatIndexedDate,
  groupEpisodesBySeason,
  isCharacterId,
} from '@/lib/character-profile';

function episode(id: string, code: string): Episode {
  return { id, name: `Episode ${id}`, airDate: 'December 2, 2013', episode: code };
}

describe('character profile helpers', () => {
  it.each([
    ['1', true],
    ['826', true],
    ['0', false],
    ['01', false],
    ['-1', false],
    ['1.5', false],
    ['abc', false],
    ['', false],
  ])('isCharacterId(%p) is %p', (id, expected) => {
    expect(isCharacterId(id)).toBe(expected);
  });

  it('builds the profile path', () => {
    expect(characterPath('42')).toBe('/characters/42');
  });

  it('groups episodes by season in air order, with unreadable codes last', () => {
    const groups = groupEpisodesBySeason([
      episode('1', 'S01E01'),
      episode('2', 'S01E02'),
      episode('3', 'special'),
      episode('4', 'S02E01'),
    ]);

    expect(groups.map((g) => [g.season, g.episodes.map((e) => e.id)])).toEqual([
      [1, ['1', '2']],
      [2, ['4']],
      [0, ['3']],
    ]);
  });

  it.each([
    [[], 'No seasons recorded'],
    [[3], 'Season 3'],
    [[1, 2, 3], 'Seasons 1–3'],
    [[1, 3, 4], 'Seasons 1, 3, 4'],
  ])('describeSeasons(%p) is %p', (seasons, expected) => {
    expect(describeSeasons(seasons)).toBe(expected);
  });

  it('describes a known place by type and dimension', () => {
    expect(
      describePlace({ id: '1', name: 'Earth', type: 'Planet', dimension: 'Dimension C-137' }),
    ).toBe('Planet · Dimension C-137');
    expect(describePlace({ id: '3', name: 'Citadel', type: 'Space station', dimension: '' })).toBe(
      'Space station',
    );
  });

  it('notes when the API knows nothing more about a place', () => {
    expect(describePlace({ id: null, name: 'unknown', type: '', dimension: '' })).toBe(
      'No further records',
    );
  });

  it('formats the indexed date in UTC', () => {
    expect(formatIndexedDate('2017-11-04T23:48:46.250Z')).toBe('Nov 4, 2017');
    expect(formatIndexedDate('')).toBeNull();
    expect(formatIndexedDate('not a date')).toBeNull();
  });
});
