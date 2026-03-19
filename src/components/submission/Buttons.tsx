export const Buttons: React.FC<{ clearInput: () => void, analyze: () => void, isDisabled: boolean }> = ({ clearInput, analyze, isDisabled }) => {
    return (
        <div className="flex mt-2 justify-end">
            <div className="sm:m-2">
                <button onClick={clearInput} className="w-24 p-2 bg-red-500 text-white rounded">
                    Clear
                </button>
            </div>
            <div className="sm:m-2 ml-2 mr-0">
                <button
                    onClick={() => analyze()}
                    className={`w-24 p-2 mr-1 bg-green-500 text-white rounded ${isDisabled ? 'bg-green-200 cursor-not-allowed' : 'bg-green-600'}`}
                    disabled={isDisabled}>
                    Analyze
                </button>
            </div>
        </div>
    )
}