import {
    query_naiveFilterToArray,
    query_naiveToArrayFilter,
    query_rawTokenSearch, query_soundexTokenSearch, query_stemmedSoundexTokenSearch,
    query_stemmedTokenSearch
} from "../databaseFTS";
import {useEffect, useState} from "react";

const queryTypes = [
    'NAIVE-FILTER-TO-ARRAY',
    'NAIVE-TO-ARRAY-FILTER',
    'RAW-TOKEN',
    'STEMMED-TOKEN',
    'SOUNDEX-TOKEN',
    'STEMMED-SOUNDEX-TOKEN'
]

const QueryByType = ({queryType, setQueryType}) => {
    return <select value={queryType} onChange={(e) => setQueryType(e.target.value)} name="" id="">
        {queryTypes.map(qt => <option key={qt} value={qt}>{qt}</option>)}
    </select>
}

const LiveQueryView = () => {

    const [liveQuery, setLiveQuery] = useState('')
    const [liveQueryType, setLiveQueryType] = useState(queryTypes[0])
    const [liveQueryResults, setLiveQueryResults] = useState({})
    const [isQuerying, setIsQuerying] = useState(false)

    useEffect(() =>
        runLiveQuery(liveQuery)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    , [liveQueryType])

    const runLiveQuery = async (query) => {
        if (query.trim() === '') return
        setIsQuerying(true)
        let result
        switch (liveQueryType) {
            case 'NAIVE-FILTER-TO-ARRAY':
                result = await query_naiveFilterToArray(query);
                break;
            case 'NAIVE-TO-ARRAY-FILTER':
                result = await query_naiveToArrayFilter(query);
                break;
            case 'RAW-TOKEN':
                result = await query_rawTokenSearch(query);
                break;
            case 'STEMMED-TOKEN':
                result = await query_stemmedTokenSearch(query);
                break;
            case 'SOUNDEX-TOKEN':
                result = await query_soundexTokenSearch(query);
                break;
            case 'STEMMED-SOUNDEX-TOKEN':
                result = await query_stemmedSoundexTokenSearch(query);
                break;
            default:
                return
        }

        setLiveQueryResults(result)
        setIsQuerying(false)
    }


    const generateMain = () => {
        console.log('Live query results', liveQueryResults)
        if (Object.keys(liveQueryResults).length === 0) {
            return null
        } else if (isQuerying) {
            return <div>Searching...</div>
        } else {
            return <>
                <h2>Live Searching Results</h2>
                <table className='live-query-result-table'>
                    <tbody>

                    <tr>
                        <th className='align-left'>Type</th>
                        <td className='align-left'>{liveQueryType}</td>
                    </tr>
                    <tr>
                        <th className='align-left'>Execution Time</th>
                        <td className='align-left'>{liveQueryResults.query_time} ms</td>
                    </tr>
                    <tr>
                        <th className='align-left'>
                            Processed Query
                        </th>
                        <td className='align-left'>{liveQueryResults.queryProcessed}</td>
                    </tr>
                    <tr>
                        <th className='align-left'>Matches</th>
                        <td className='align-left'>{liveQueryResults.queryResults_length}</td>
                    </tr>
                    </tbody>
                </table>
                <div>
                    <h3>Matches</h3>
                    {liveQueryResults.queryResults?.map(paragraph => <p key={paragraph.id}>{paragraph.text}</p>)}
                </div>
            </>
        }
    }

    return <div id='LIVE-QUERY'>
        <h2>Live Searching</h2>
        <form onSubmit={async e => {
            e.preventDefault();
            await runLiveQuery(liveQuery);
        }}>
            <fieldset>
                <legend>Query Type</legend>
                <QueryByType queryType={liveQueryType} setQueryType={setLiveQueryType}/>
            </fieldset>
            <fieldset>
                <legend>Search Query</legend>
                <input className='live-query--search-input' type="text" value={liveQuery}
                       onChange={e => {setLiveQuery(e.target.value); setLiveQueryResults({})} }/>
            </fieldset>
            <fieldset>
                <button className='live-query--search-button' onClick={() => runLiveQuery(liveQuery)}>Search</button>
            </fieldset>
        </form>
        <main>
            {generateMain()}
        </main>
    </div>
}

export default LiveQueryView