# Dexie Full-Text Search Testing

Run tests @ [Dexie Full-Text Search Testing](https://sad-wescoff-93b328.netlify.app/)

Compares various methods of tokenizing and searching in Dexie

## Naive Methods over Raw Text

These methods search over raw text with regex. Viable on small datasets. Become too slow on larger datasets. 

**Naive Filter Collection with Regex to Array**

  - Slowest method. Filters the collection with Dexie's `table.filter` method with regex over raw text. Misses close matches.

**Naive Collection to Array, then Filter with Regex**

  - Slight improvement over previous. Converts Dexie table to array and then uses JavaScript's native `filter` method. Misses close matches.

## Tokenized Search 

These methods search over indexed tokens. Text is first normalized and then tokenized with various methods. Results are slightly fuzzier. These are fast enough to handle live search on large-ish datasets (10000+ records).  Misses non-exact matches.

**Plain Tokens**

  - Give similar results to naive search with massive speed improvement. Misses non-exact matches.

**Stemmed Tokens**

  - Tokens are stemmed after normalization. Gives more acurate results than plain tokens. Most "human" result.  

**Soundex-ed Tokens** 

  - Tokens are soundex-ed after normalization. Gives fuzzy results. Matches can seem odd. 

**Stemmed Soundexed Tokens**

  - Tokens are stemmed and then soundexed. Generally similar to soundex-ed search method. Gives fuzzy results. Matches can seem odd.
