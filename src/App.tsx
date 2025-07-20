import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Brain,
  BookOpen,
  CheckCircle,
  XCircle,
  Play,
  ArrowRight,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// GraphQL queries and mutations
const GET_ITEMS = gql`
  query GetItems {
    allItems {
      id
      name
      category
    }
  }
`;

const START_LEARNING = gql`
  mutation StartLearning($sessionName: String!) {
    startLearning(sessionName: $sessionName)
  }
`;

const ANSWER_QUERY = gql`
  mutation AnswerQuery($sessionId: Int!, $response: String!) {
    answerQuery(sessionId: $sessionId, response: $response)
  }
`;

const GET_CURRENT_DFA_STATE = gql`
  query GetCurrentDFAState($sessionId: Int!) {
    currentDFAState(sessionId: $sessionId)
  }
`;

interface LearningState {
  sessionId: number | null;
  currentQuery: {
    id: number;
    type: string;
    data: string;
  } | null;
  isComplete: boolean;
  finalResult: {
    states?: string[];
    acceptStates?: string[];
    startState?: string;
    metrics?: {
      accuracy: number;
      totalQueries: number;
      correctPredictions: number;
    };
  } | null;
  error: string | null;
}

interface FoodItem {
  id: number;
  name: string;
  category: string | null;
}

function App() {
  const [learningState, setLearningState] = useState<LearningState>({
    sessionId: null,
    currentQuery: null,
    isComplete: false,
    finalResult: null,
    error: null,
  });
  const [oracleResponse, setOracleResponse] = useState("");
  const [sessionName, setSessionName] = useState("Food Categorization");

  const { data: itemsData } = useQuery(GET_ITEMS);

  const { data: dfaStateData } = useQuery(GET_CURRENT_DFA_STATE, {
    variables: { sessionId: learningState.sessionId },
    skip: !learningState.sessionId,
  });

  const [startLearning, { loading: startLoading }] =
    useMutation(START_LEARNING);
  const [answerQuery, { loading: answerLoading }] = useMutation(ANSWER_QUERY, {
    refetchQueries: [
      {
        query: GET_CURRENT_DFA_STATE,
        variables: { sessionId: learningState.sessionId },
      },
    ],
  });

  const handleStartLearning = async () => {
    try {
      const result = await startLearning({
        variables: { sessionName },
      });

      const data = JSON.parse(result.data.startLearning);
      setLearningState({
        sessionId: data.sessionId,
        currentQuery: data.currentQuery,
        isComplete: data.isComplete,
        finalResult: data.finalResult,
        error: null,
      });
    } catch (error) {
      console.error("Error starting learning:", error);
      setLearningState((prev) => ({
        ...prev,
        error: "Failed to start learning",
      }));
    }
  };

  const handleAnswerQuery = async (response: string) => {
    if (!learningState.sessionId) return;

    try {
      const result = await answerQuery({
        variables: {
          sessionId: learningState.sessionId,
          response,
        },
      });

      const data = JSON.parse(result.data.answerQuery);

      if (data.error) {
        setLearningState((prev) => ({ ...prev, error: data.error }));
        return;
      }

      setLearningState({
        sessionId: learningState.sessionId,
        currentQuery: data.nextQuery,
        isComplete: data.isComplete,
        finalResult: data.finalResult,
        error: null,
      });

      setOracleResponse("");
    } catch (error) {
      console.error("Error answering query:", error);
      setLearningState((prev) => ({
        ...prev,
        error: "Failed to answer query",
      }));
    }
  };

  const handleQuickAnswer = (response: string) => {
    handleAnswerQuery(response);
  };

  const renderCurrentQuery = () => {
    if (!learningState.currentQuery) return null;

    const queryData = JSON.parse(learningState.currentQuery.data);

    // For equivalence queries, use the current DFA state instead of stored data
    if (learningState.currentQuery.type === "equivalence" && dfaStateData) {
      try {
        const currentDfaState = JSON.parse(dfaStateData.currentDFAState);
        if (!currentDfaState.error) {
          // Replace the stored hypothesis with current DFA state
          queryData.hypothesis = {
            states: currentDfaState.states,
            alphabet: currentDfaState.alphabet,
            transitions: currentDfaState.transitions,
            startState: currentDfaState.startState,
            acceptStates: currentDfaState.acceptStates,
          };
          // Keep the original progress data
          // queryData.progress remains unchanged
        }
      } catch (error) {
        console.error("Error parsing current DFA state:", error);
      }
    }

    return (
      <div className="border-2 border-yellow-300 rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-orange-50">
        <div className="flex items-center justify-between mb-3">
          <Badge
            variant="outline"
            className="capitalize bg-yellow-100 text-yellow-800 border-yellow-300"
          >
            {learningState.currentQuery.type === "membership"
              ? "🎯 Membership"
              : "🔍 Equivalence"}{" "}
            Query
          </Badge>
        </div>

        {learningState.currentQuery.type === "membership" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold text-lg mb-2">
                {queryData.question}
              </h4>
              <p className="text-gray-600 mb-3">{queryData.context}</p>

              {queryData.examples && (
                <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                  <h5 className="font-medium text-blue-900 mb-2">Examples:</h5>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>
                      <strong>Target category ({queryData.category}):</strong>{" "}
                      {queryData.examples[queryData.category]}
                    </p>
                    <p>
                      <strong>Other items:</strong> {queryData.examples.other}
                    </p>
                  </div>
                </div>
              )}

              {queryData.progress && (
                <div className="mt-3 text-sm text-gray-600">
                  Progress: M: {queryData.progress.membershipQueries}/
                  {queryData.progress.maxMembershipQueries}, E:{" "}
                  {queryData.progress.equivalenceQueries}/
                  {queryData.progress.maxEquivalenceQueries}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={() => handleQuickAnswer("true")}
                  disabled={answerLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Yes
                </Button>
                <Button
                  onClick={() => handleQuickAnswer("false")}
                  disabled={answerLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  No
                </Button>
              </div>

              <div className="flex gap-2">
                <Input
                  value={oracleResponse}
                  onChange={(e) => setOracleResponse(e.target.value)}
                  placeholder="Or type your answer..."
                  className="flex-1"
                />
                <Button
                  onClick={() => handleAnswerQuery(oracleResponse)}
                  disabled={answerLoading || !oracleResponse.trim()}
                >
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {learningState.currentQuery.type === "equivalence" && (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="font-semibold text-lg mb-2">Review Hypothesis</h4>
              <p className="text-gray-600 mb-3">{queryData.instruction}</p>

              {/* Target Category Examples */}
              {queryData.examples &&
                queryData.examples[queryData.targetCategory] && (
                  <div className="bg-green-50 p-3 rounded border-l-4 border-green-400 mb-3">
                    <h5 className="font-medium text-green-900 mb-2">
                      Target Category Examples:
                    </h5>
                    <p className="text-green-800">
                      <strong>{queryData.targetCategory}:</strong>{" "}
                      {queryData.examples[queryData.targetCategory]}
                    </p>
                  </div>
                )}

              <div className="bg-gray-50 p-3 rounded">
                <h5 className="font-medium mb-2">Current Hypothesis:</h5>
                <div className="text-sm space-y-2">
                  <div>
                    <strong>Target Category:</strong>{" "}
                    {queryData.hypothesis.targetCategory || "Unknown"}
                  </div>
                  <div>
                    <strong>
                      Accept States (
                      {queryData.hypothesis.acceptStates?.length || 0} items):
                    </strong>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {queryData.hypothesis.acceptStates?.map(
                        (state: string) => (
                          <Badge
                            key={state}
                            variant="default"
                            className="bg-green-100 text-green-800"
                          >
                            {state}
                          </Badge>
                        )
                      ) || <span className="text-gray-500">None</span>}
                    </div>
                  </div>
                  <div>
                    <strong>Total States:</strong>{" "}
                    {queryData.hypothesis.states?.length || 0} items
                  </div>
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      Show full DFA details
                    </summary>
                    <pre className="text-xs mt-2 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                      {JSON.stringify(queryData.hypothesis, null, 2)}
                    </pre>
                  </details>
                </div>
              </div>

              {queryData.examples && (
                <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400 mt-3">
                  <h5 className="font-medium text-blue-900 mb-2">
                    How to respond:
                  </h5>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>
                      <strong>If correct:</strong> {queryData.examples.correct}
                    </p>
                    <p>
                      <strong>If incorrect:</strong>{" "}
                      {queryData.examples.counterexample}
                    </p>
                  </div>
                </div>
              )}

              {queryData.progress && (
                <div className="mt-3 text-sm text-gray-600">
                  Progress: M: {queryData.progress.membershipQueries}/
                  {queryData.progress.maxMembershipQueries}, E:{" "}
                  {queryData.progress.equivalenceQueries}/
                  {queryData.progress.maxEquivalenceQueries}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleQuickAnswer("correct")}
                disabled={answerLoading}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Correct
              </Button>
              <Input
                value={oracleResponse}
                onChange={(e) => setOracleResponse(e.target.value)}
                placeholder="Or provide counterexample..."
                className="flex-1"
              />
              <Button
                onClick={() => handleAnswerQuery(oracleResponse)}
                disabled={answerLoading || !oracleResponse.trim()}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderFinalResult = () => {
    if (!learningState.finalResult) return null;

    return (
      <div className="border-2 border-green-300 rounded-lg p-4 bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center justify-between mb-3">
          <Badge
            variant="outline"
            className="capitalize bg-green-100 text-green-800 border-green-300"
          >
            🎉 Learning Complete!
          </Badge>
        </div>

        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold text-lg mb-2">Learned DFA</h4>
            <div className="space-y-2">
              <p>
                <strong>States:</strong>{" "}
                {learningState.finalResult.states?.join(", ")}
              </p>
              <p>
                <strong>Accept States:</strong>{" "}
                {learningState.finalResult.acceptStates?.join(", ") || "None"}
              </p>
              <p>
                <strong>Start State:</strong>{" "}
                {learningState.finalResult.startState}
              </p>
            </div>
          </div>

          {learningState.finalResult.metrics && (
            <div className="bg-blue-50 p-4 rounded-lg border">
              <h5 className="font-medium text-blue-900 mb-2">
                Learning Metrics
              </h5>
              <div className="text-sm text-blue-800 space-y-1">
                <p>
                  <strong>Accuracy:</strong>{" "}
                  {learningState.finalResult.metrics.accuracy}%
                </p>
                <p>
                  <strong>Total Queries:</strong>{" "}
                  {learningState.finalResult.metrics.totalQueries}
                </p>
                <p>
                  <strong>Correct Predictions:</strong>{" "}
                  {learningState.finalResult.metrics.correctPredictions}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Brain className="h-12 w-12 text-purple-600 mr-3" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Logic & Learning Lab
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Interactive concept learning using Angluin's L* algorithm. Help the
            AI learn to categorize food items through oracle queries.
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Error Display */}
          {learningState.error && (
            <Alert className="border-red-300 bg-red-50">
              <XCircle className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                {learningState.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Start Learning Section */}
          {!learningState.sessionId && (
            <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
              <CardHeader>
                <CardTitle className="flex items-center text-purple-900">
                  <Play className="h-5 w-5 mr-2" />
                  Start Learning Session
                </CardTitle>
                <CardDescription>
                  Begin a new learning session to teach the AI about food
                  categorization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="sessionName">Session Name</Label>
                  <Input
                    id="sessionName"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="Enter session name..."
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleStartLearning}
                  disabled={startLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {startLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Brain className="h-4 w-4 mr-2" />
                  )}
                  Start Learning
                </Button>
              </CardFooter>
            </Card>
          )}

          {/* Current Query */}
          {learningState.currentQuery && renderCurrentQuery()}

          {/* Current DFA State */}
          {learningState.sessionId && dfaStateData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  Current DFA State
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  try {
                    const dfaState = JSON.parse(dfaStateData.currentDFAState);
                    if (dfaState.error) {
                      return <p className="text-red-600">{dfaState.error}</p>;
                    }

                    return (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-blue-50 p-3 rounded border">
                            <h5 className="font-medium text-blue-900 mb-2">
                              Target Category
                            </h5>
                            <p className="text-blue-800">
                              {dfaState.targetCategory}
                            </p>
                          </div>
                          <div className="bg-green-50 p-3 rounded border">
                            <h5 className="font-medium text-green-900 mb-2">
                              Accept States
                            </h5>
                            <p className="text-green-800">
                              {dfaState.acceptStates?.length > 0
                                ? dfaState.acceptStates.join(", ")
                                : "None yet"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gray-50 p-3 rounded">
                          <h5 className="font-medium mb-2">Learning Summary</h5>
                          <div className="text-sm space-y-1">
                            <p>
                              <strong>Accept States:</strong>{" "}
                              {dfaState.acceptStates?.length || 0} items
                            </p>
                            <p>
                              <strong>Total States:</strong>{" "}
                              {dfaState.states?.length || 0} items
                            </p>
                            <p>
                              <strong>Alphabet Size:</strong>{" "}
                              {dfaState.alphabet?.length || 0} items
                            </p>
                          </div>
                        </div>

                        <details className="bg-gray-50 p-3 rounded">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-800 font-medium">
                            Show all states and details
                          </summary>
                          <div className="mt-3 space-y-3">
                            <div>
                              <h6 className="font-medium mb-1">All States:</h6>
                              <div className="flex flex-wrap gap-1">
                                {dfaState.states?.map((state: string) => (
                                  <Badge
                                    key={state}
                                    variant={
                                      dfaState.acceptStates?.includes(state)
                                        ? "default"
                                        : "outline"
                                    }
                                    className={
                                      dfaState.acceptStates?.includes(state)
                                        ? "bg-green-100 text-green-800"
                                        : ""
                                    }
                                  >
                                    {state}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h6 className="font-medium mb-1">Full DFA:</h6>
                              <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                                {JSON.stringify(dfaState, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </details>
                      </div>
                    );
                  } catch (error) {
                    console.error("Error parsing DFA state:", error);
                    return (
                      <p className="text-red-600">Error parsing DFA state</p>
                    );
                  }
                })()}
              </CardContent>
            </Card>
          )}

          {/* Final Result */}
          {learningState.isComplete && renderFinalResult()}

          {/* Food Items Reference */}
          {itemsData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Available Food Items
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {itemsData.allItems.map((item: FoodItem) => (
                    <Badge
                      key={item.id}
                      variant="outline"
                      className="text-center"
                    >
                      {item.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
