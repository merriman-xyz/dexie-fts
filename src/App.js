import logo from './logo.svg';
import './index.css';
import {
    populateDatabase,
    query_naiveFilterToArray,
    query_naiveToArrayFilter,
    query_rawTokenSearch, query_soundexTokenSearch, query_stemmedSoundexTokenSearch, query_stemmedTokenSearch,
    runFTSTest
} from "./databaseFTS";
import {useEffect, useState} from "react";
import {Link} from "react-router-dom";

const ResultTable = ({query, results}) => {
    return <div>
        <h2>{query}</h2>
        <table>
            <thead>
            <th>Query Type</th>
            <th>Query Time (ms)</th>
            <th>Query Result Count</th>
            </thead>
            <tbody>
            {results.map((result) => <tr key={result.type}>
                <td>{result.type}</td>
                <td>{result.query_time} ms</td>
                <td>{result.queryResults_length}</td>
            </tr>)}
            </tbody>
        </table>
    </div>
}

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

function App() {

    const [paragraphs, setParagraphs] = useState([])
    const [progress, setProgress] = useState('')
    const [query, setQuery] = useState('houses')
    const [liveQuery, setLiveQuery] = useState('')
    const [liveQueryType, setLiveQueryType] = useState(queryTypes[0])
    const [liveQueryTime, setLiveQueryTime] = useState(0)
    const [liveQueryResults, setLiveQueryResults] = useState([])
    const [liveQueryProcessed, setLiveQueryProcessed] = useState('')
    const [results, setResults] = useState([])
    const [inputQuery, setInputQuery] = useState('')

    useEffect(() => {
        const aiw = "https://gist.githubusercontent.com/phillipj/4944029/raw/75ba2243dd5ec2875f629bf5d79f6c1e4b5a8b46/alice_in_wonderland.txt"
        const wap = "https://raw.githubusercontent.com/mmcky/nyu-econ-370/master/notebooks/data/book-war-and-peace.txt"
        populateDatabase(aiw, setProgress).then(paragraphs$processed => {
            setParagraphs(paragraphs$processed)
            return runFTSTest(query)
        }).then(results => {
            setResults(results)
        })

    }, [])

    useEffect(() => {
        if (paragraphs.length === 0) {
            return
        }
        setResults([])
        runFTSTest(query).then(results => {
            setResults(results)
        })
    }, [query])

    useEffect(() => {
        if (liveQuery.trim() === '') return
    }, [liveQuery])

    const runLiveQuery = async (e) => {

        e.preventDefault()
        const query = e.target.value
        setLiveQuery(query)
        if (e.target.value.trim() === '') return
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

        setLiveQueryTime(result.query_time)
        setLiveQueryResults(result.queryResults)
        setLiveQueryProcessed(result.queryProcessed.join(', '))

    }

    return (
        <div>
            <header>
                <h1>Fulltext Search Experimentation</h1>
                <nav>
                    <Link to={'test'}>Testing</Link>
                    <Link to={'liveQuery'}>Live Querying</Link>
                </nav>
            </header>
            <input value={inputQuery} onChange={e => setInputQuery(e.target.value)} type="text"/>
            <button onClick={() => setQuery(inputQuery)}>Input Query</button>
            <ResultTable query={query} results={results}></ResultTable>
            <form action="">
                <input type="text" value={liveQuery} onChange={e => runLiveQuery(e)}/>
                <QueryByType queryType={liveQueryType} setQueryType={setLiveQueryType}/>
                {liveQueryTime}
                {liveQueryProcessed}
                {liveQueryResults.map(p => <p key={p.id}>{p.text}</p>)}
            </form>


        </div>
    );
}

export default App;
