import {
  countActiveFilters,
  filtersKey,
  filtersToSearchParams,
  normalizeFilters,
  parseFilters,
} from '@/lib/character-filters';

describe('parseFilters', () => {
  it('reads every filter from URLSearchParams', () => {
    const params = new URLSearchParams(
      'name=rick&status=Alive&species=Human&type=Clone&gender=Male&page=3',
    );

    expect(parseFilters(params)).toEqual({
      name: 'rick',
      status: 'Alive',
      species: 'Human',
      type: 'Clone',
      gender: 'Male',
    });
  });

  it('reads a Next searchParams record and takes the first of repeated values', () => {
    expect(parseFilters({ name: ['morty', 'rick'], status: 'Dead' })).toEqual({
      name: 'morty',
      status: 'Dead',
    });
  });

  it('trims text and drops empty values', () => {
    expect(parseFilters({ name: '  rick ', species: '   ', type: '' })).toEqual({ name: 'rick' });
  });

  it('drops unknown status and gender values', () => {
    expect(parseFilters({ status: 'Zombie', gender: 'alive' })).toEqual({});
  });
});

describe('filtersToSearchParams', () => {
  it('writes keys in a fixed order regardless of input order', () => {
    const params = filtersToSearchParams({ gender: 'Female', name: 'beth', status: 'Alive' });
    expect(params.toString()).toBe('name=beth&status=Alive&gender=Female');
  });

  it('never includes the page', () => {
    expect(filtersToSearchParams({ name: 'rick', page: 2 }).has('page')).toBe(false);
  });
});

describe('filtersKey', () => {
  it('is the same for equal filter sets', () => {
    expect(filtersKey({ status: 'Alive', name: 'rick' })).toBe(
      filtersKey({ name: ' rick ', status: 'Alive', species: '' }),
    );
  });

  it('is empty when no filter is set', () => {
    expect(filtersKey({})).toBe('');
    expect(filtersKey({ name: undefined, page: 1 })).toBe('');
  });
});

describe('normalizeFilters', () => {
  it('removes unset values and the page', () => {
    expect(normalizeFilters({ name: 'rick', status: undefined, page: 2 })).toEqual({
      name: 'rick',
    });
  });
});

describe('countActiveFilters', () => {
  it('counts panel filters but not the name search', () => {
    expect(countActiveFilters({ name: 'rick', status: 'Alive', type: 'Clone' })).toBe(2);
  });
});
