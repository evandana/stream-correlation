# Data Analysis

## Data Source WebSocket API

### OUTGOING Messages

1. `subscribe` - Update for a series with a new value
    - DATA_OBJECT will be an array of series labels, e.g. `['a', 'b', 'c']`

```json
{
	"type": "utf8",
	"utf8Data": "{\"action\":\"ACTION\",\"series\":\"c\",\"data\":DATA_OBJECT}"
}
```

### INCOMING Messages

1. `update` - Update for a series with a new value
    - DATA_OBJECT will be a single value, e.g. `2`
1. `series` - Update for a series with entire data array
    - DATA_OBJECT will be an array of values, e.g. `[1, 2, 3]`

```json
{
	"type": "utf8",
	"utf8Data": "{\"action\":\"ACTION\",\"series\":\"c\",\"data\":DATA_OBJECT}"
}
```

## Browser WebSocket API

### INCOMING Messages

1. `subscribe` - Subscribe to a series (will return threads that include that series)
1. `unsubscribe` - Unsubscribe to a series (will unsubscribe from threads with that series, unless other subscriptions for that thread remain)


```json
{
	"type": "utf8",
	"utf8Data": "{\"action\":\"ACTION\",\"series\":[\"c\"],\"data\":DATA_OBJECT}"
}
```

### OUTGOING Messages

1. `thread` - Data object will contain the entire thread data
1. `update` - DATA_OBJECT will contain the updated value for that thread-series index


```json
{
	"type": "utf8",
	"utf8Data": "{\"action\":\"ACTION\",\"thread\":\"1\",\"data\":DATA_OBJECT}"
}
```


1. **DATA_OBJECT** Sample

```json
{
	"threadMapping": {
		"a": 0,
		"b": 1,
		"c": 2
	},
	"threads": [
		[
			{
				"series": "a",
				"data": [ 886, 786, 136, 117, 342, 308, 182, 911, 22, 804 ]
			}
		],
		[
			{
				"series": "b",
				"data": [ 273, 89, 118, 485, 529, 630, 838, 707, 630, 571 ]
			}
		],
		[
			{
				"series": "c",
				"data": [ 520, 779, 431, 478, 447, 385, 868, 427, 223, 613 ]
			}
		]
	]
}
```