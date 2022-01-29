import {useState} from "react";
import {runFTSTest} from "../databaseFTS";

const FTSTestResultTable = ({query, queryResults}) => {
    return <div className='fts-test--result-table'>
        <h2>Test Results</h2>
        <br/>
        <table>
            <thead>
            <tr>
                <th></th>
                <th>Execution Time (ms)</th>
                <th>Result Count</th>
                <th>Actual Query</th>
            </tr>
            </thead>
            <tbody>
            {queryResults.map((result) => <tr key={result.type}>
                <th>{result.type}</th>
                <td>{result.query_time} ms</td>
                <td>{result.queryResults_length} matches</td>
                <td>{result.queryProcessed}</td>
            </tr>)}
            </tbody>
        </table>
    </div>
}

const FTSTestView = () => {

    const [testQuery, setTestQuery] = useState('')
    const [testQueryResults, setTestQueryResults] = useState([])
    const [runningTests, setRunningTests] = useState(false)

    const runFTSTestOnTestQuery = async () => {
        if (testQuery.trim() === '') return

        setRunningTests(true)
        const FTSTestResults = await runFTSTest(testQuery)
        setTestQueryResults(FTSTestResults)
        setRunningTests(false)

    }

    const generateResultsTable = () => {
        if (testQueryResults.length === 0) {
            return null
        } else {
            return <FTSTestResultTable query={testQuery} queryResults={testQueryResults}></FTSTestResultTable>
        }
    }


    return <div id='FTS-TEST'>
        <h2>Search Test</h2>
        <h3>{runningTests ? 'Test running...' : 'Enter a test query and click "Run Search Test" to start'}</h3>
        <form onSubmit={e => e.preventDefault()}>
            <fieldset>
                <legend>Search Query:</legend>
                <input className='fts-test--search-input' disabled={runningTests} value={testQuery} onChange={e => setTestQuery(e.target.value)}
                       type="text"/>
            </fieldset>
            <fieldset>
                <button className='fts-test--search-button' disabled={runningTests} onClick={() => runFTSTestOnTestQuery(testQuery)}>Run Search Test</button>
            </fieldset>
        </form>
        {generateResultsTable()}
    </div>
}

export default FTSTestView