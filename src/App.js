import './index.css';
import {populateDatabase} from "./databaseFTS";

import {useEffect, useState} from "react";
import {Link, Route, Routes} from "react-router-dom";
import FTSTestView from "./Views/FTSTestView";
import LiveQueryView from "./Views/LiveQueryView";

const sources = [
    {
        title: 'Alice in Wonderland',
        size: 'Medium',
        url: 'https://gist.githubusercontent.com/phillipj/4944029/raw/75ba2243dd5ec2875f629bf5d79f6c1e4b5a8b46/alice_in_wonderland.txt'
    },
    {
        title: 'War and Peace',
        size: 'Large',
        url: 'https://raw.githubusercontent.com/mmcky/nyu-econ-370/master/notebooks/data/book-war-and-peace.txt'
    },
    {
        title: 'Structure and Interpretation of Computer Programs',
        size: 'Large',
        url: 'https://gist.githubusercontent.com/merriman-xyz/56c7f7425ad71e9f3cf5195fc45c4ff6/raw/d88770748f244984c17660a181068b01145b115d/sicp.txt'
    }
]


const SelectCurrentSource = ({disabled, currentSource, setCurrentSource}) => {

    const handleUpdateCurrentSource = (e) => {
        const selectedSourceTitle = e.target.value
        const newSource = sources.find((source) => source.title === selectedSourceTitle)
        setCurrentSource(newSource)
    }

    return <select disabled={disabled} value={currentSource.title} onChange={handleUpdateCurrentSource} name="" id="">
        {sources.map(source => <option key={source.title} value={source.title}>{source.title}</option>)}
    </select>
}

function App() {

    const [sourceLoaded, setSourceLoaded] = useState(false)
    const [loadingProgress, setLoadingProgress] = useState('')
    const [currentSource, setCurrentSource] = useState(sources[0])
    const [selectedSource, setSelectedSource] = useState(sources[0])
    const [currentSourceStats, setCurrentSourceStats] = useState({})

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { loadSource() }, [])

    const loadSource = async () => {
        setSourceLoaded(false)
        const loadedSourceStats = await populateDatabase(selectedSource.url, setLoadingProgress)
        setCurrentSourceStats(loadedSourceStats)
        setCurrentSource(selectedSource)
        setSourceLoaded(true)
    }

    const generateStats = () => {
        if(!sourceLoaded || !currentSourceStats) {
            return null
        } else {
            return <table>
                <tbody>
                    <tr><th className='align-left'>Word Count</th><td className='align-left'>{currentSourceStats.wordCount}</td></tr>
                    <tr><th className='align-left'>Paragraph Count</th><td className='align-left'>{currentSourceStats.paragraphCount}</td></tr>
                </tbody>
            </table>
        }
    }
    const generateMain = () => {
        if (!sourceLoaded) {
            return <>
                <div> Current Source: <br/> <h2>{selectedSource.title} </h2></div>
                <div>Loading <em>{selectedSource.title}</em>:</div>
                <div>{loadingProgress}</div>
            </>
        } else {
            return <>
                <div> Current Source: <br/> <h2>{currentSource.title} </h2></div>
                <header>
                    {generateStats()}
                    <fieldset className='select-current-source'>
                        <legend>Select new source</legend>
                        <SelectCurrentSource disabled={!sourceLoaded} currentSource={selectedSource}
                                             setCurrentSource={setSelectedSource}/>
                        <button disabled={!sourceLoaded} onClick={loadSource}>Load New Source</button>
                    </fieldset>
                    <div>
                        <hr/>
                    </div>
                    <nav className='app-nav'>
                        <Link to='FTSTest'>Search Test</Link>
                        <Link to='liveQuery'>Live Searching</Link>
                    </nav>

                </header>
                <div>
                    <hr/>

                </div>

                <Routes>
                    <Route path='/liveQuery' element={<LiveQueryView/>}/>
                    <Route path='/FTSTest' element={<FTSTestView/>}/>
                </Routes>
            </>
        }
    }


    return (
        <div id='APP'>
            <header>
                <h1>IndexedDB (Dexie) Full-Text-Search Testing</h1>
            </header>
            <main>
                {generateMain()}
            </main>
        </div>
    );
}

export default App;
