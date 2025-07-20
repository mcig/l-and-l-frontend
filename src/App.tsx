import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Play, Check, X, RefreshCw } from "lucide-react";

// TypeScript interfaces
interface Item {
  id: number;
  name: string;
  category: string | null;
}

interface OracleQuery {
  id: number;
  queryType: string;
  queryData: string;
  response: string | null;
  status: string;
}

interface LearnedDFA {
  id: number;
  states: string;
  alphabet: string;
  transitions: string;
  startState: string;
  acceptStates: string;
}

interface LearningSession {
  id: number;
  name: string;
  description: string | null;
  status: string;
  oracleQueries: OracleQuery[];
  learnedDFA: LearnedDFA | null;
}

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

const GET_LEARNING_SESSIONS = gql`
  query GetLearningSessions {
    allLearningSessions {
      id
      name
      description
      status
      oracleQueries {
        id
        queryType
        queryData
        response
        status
      }
      learnedDFA {
        id
        states
        alphabet
        transitions
        startState
        acceptStates
      }
    }
  }
`;

const GET_PENDING_QUERIES = gql`
  query GetPendingQueries($sessionId: Int!) {
    pendingOracleQueries(sessionId: $sessionId) {
      id
      queryType
      queryData
      status
    }
  }
`;

const CREATE_SESSION = gql`
  mutation CreateSession($data: LearningSessionInput!) {
    createLearningSession(data: $data) {
      id
      name
      description
      status
    }
  }
`;

const ANSWER_QUERY = gql`
  mutation AnswerQuery($queryId: Int!, $response: String!) {
    answerOracleQuery(queryId: $queryId, response: $response) {
      id
      queryType
      queryData
      response
      status
    }
  }
`;

const RUN_ALGORITHM = gql`
  mutation RunAlgorithm($sessionId: Int!) {
    runAngluinAlgorithm(sessionId: $sessionId)
  }
`;

const GET_LEARNING_METRICS = gql`
  query GetLearningMetrics($sessionId: Int!) {
    learningMetrics(sessionId: $sessionId)
  }
`;

function App() {
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [oracleResponse, setOracleResponse] = useState("");
  const [currentQueryIndex, setCurrentQueryIndex] = useState(0);

  const { data: itemsData, loading: itemsLoading } = useQuery(GET_ITEMS);
  const { data: sessionsData } = useQuery(GET_LEARNING_SESSIONS);

  const { data: pendingQueriesData } = useQuery(GET_PENDING_QUERIES, {
    variables: { sessionId: selectedSession },
    skip: !selectedSession,
  });

  const { data: metricsData } = useQuery(GET_LEARNING_METRICS, {
    variables: { sessionId: selectedSession },
    skip: !selectedSession,
  });

  const [createSession] = useMutation(CREATE_SESSION, {
    refetchQueries: [{ query: GET_LEARNING_SESSIONS }],
  });

  const [answerQuery] = useMutation(ANSWER_QUERY, {
    refetchQueries: [
      { query: GET_PENDING_QUERIES, variables: { sessionId: selectedSession } },
      { query: GET_LEARNING_SESSIONS },
    ],
  });

  const [runAlgorithm, { loading: algorithmLoading }] = useMutation(
    RUN_ALGORITHM,
    {
      refetchQueries: [
        { query: GET_LEARNING_SESSIONS },
        {
          query: GET_PENDING_QUERIES,
          variables: { sessionId: selectedSession },
        },
      ],
    }
  );

  const handleCreateSession = async () => {
    try {
      const result = await createSession({
        variables: {
          data: {
            name: "Food Categorization",
            description:
              "Learn to categorize food items using Angluin's algorithm",
          },
        },
      });
      setSelectedSession(result.data.createLearningSession.id);
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  const handleAnswerQuery = async (queryId: number, response: string) => {
    try {
      await answerQuery({
        variables: { queryId, response },
      });
      setOracleResponse("");
      setCurrentQueryIndex((prev) => prev + 1);
    } catch (error) {
      console.error("Error answering query:", error);
    }
  };

  const handleRunAlgorithm = async () => {
    if (!selectedSession) return;

    try {
      await runAlgorithm({
        variables: { sessionId: selectedSession },
      });
    } catch (error) {
      console.error("Error running algorithm:", error);
    }
  };

  const selectedSessionData = sessionsData?.allLearningSessions.find(
    (s: LearningSession) => s.id === selectedSession
  );

  const pendingQueries = pendingQueriesData?.pendingOracleQueries || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  🧠 Angluin's L* Algorithm Demo
                </h1>
                <p className="text-sm text-gray-600">
                  Interactive learning through membership and equivalence
                  queries
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Info Section */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">
            🧠 Angluin's L* Algorithm: Interactive Learning Demo
          </h2>
          <p className="text-gray-700 mb-4">
            Experience <strong>Angluin's L* algorithm</strong> in action! This
            interactive demo shows how a learning algorithm can discover
            categorization rules through membership and equivalence queries. The
            method starts with just a few examples and gradually builds
            understanding through oracle feedback.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">
                🎯 Incremental Learning
              </h3>
              <p className="text-blue-700">
                Starts with 3 representative items, then uses membership and
                equivalence queries to refine the hypothesis. No exhaustive
                enumeration!
              </p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <h3 className="font-medium text-green-900 mb-2">
                📊 Learning Metrics
              </h3>
              <p className="text-green-700">
                Track the algorithm's convergence in real-time. Observe how the
                learned DFA improves with each oracle response.
              </p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <h3 className="font-medium text-purple-900 mb-2">
                ⚡ Efficient Method
              </h3>
              <p className="text-purple-700">
                Limited to 8 membership queries and 3 equivalence queries to
                demonstrate the algorithm's efficiency while maintaining
                engagement.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Items List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <span>🍕 Food Items to Categorize</span>
                <Badge variant="secondary">
                  {itemsData?.allItems?.length || 0} items
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {itemsLoading ? (
                <div className="text-center py-4">Loading items...</div>
              ) : (
                <div className="space-y-2">
                  {itemsData?.allItems?.map((item: Item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium">{item.name}</span>
                      <Badge variant={item.category ? "default" : "outline"}>
                        {item.category || "Uncategorized"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Learning Session */}
          <Card>
            <CardHeader>
              <CardTitle>🧠 Interactive Learning Session</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedSession ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🚀</div>
                  <p className="text-gray-600 mb-4">
                    Ready to demonstrate Angluin's method? Start your
                    interactive learning session!
                  </p>
                  <Button
                    onClick={handleCreateSession}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Learning Session
                  </Button>
                </div>
              ) : (
                <>
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
                    <h3 className="font-semibold text-blue-900 flex items-center">
                      <Brain className="h-5 w-5 mr-2" />
                      {selectedSessionData?.name}
                    </h3>
                    <p className="text-blue-700 text-sm">
                      {selectedSessionData?.description ||
                        "Learning in progress..."}
                    </p>
                  </div>

                  {/* Learning Progress and Metrics */}
                  {metricsData && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg mb-4 border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                        📊 Learning Progress
                      </h4>
                      <div className="text-sm text-green-800">
                        {(() => {
                          try {
                            const metrics = JSON.parse(
                              metricsData.learningMetrics
                            );
                            return (
                              <div className="space-y-2">
                                <div className="grid grid-cols-3 gap-4 text-center">
                                  <div className="bg-white p-2 rounded border">
                                    <div className="text-lg font-bold text-blue-600">
                                      {metrics.totalQueries}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      Total Queries
                                    </div>
                                  </div>
                                  <div className="bg-white p-2 rounded border">
                                    <div className="text-lg font-bold text-green-600">
                                      {metrics.membershipQueries}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      Membership
                                    </div>
                                  </div>
                                  <div className="bg-white p-2 rounded border">
                                    <div className="text-lg font-bold text-purple-600">
                                      {metrics.equivalenceQueries}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      Equivalence
                                    </div>
                                  </div>
                                </div>
                                {metrics.hasLearnedDFA && (
                                  <div className="mt-3 p-2 bg-green-100 rounded border border-green-300">
                                    <p className="text-green-800 font-medium text-center">
                                      🎉 Learning completed! The DFA has been
                                      learned successfully.
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          } catch (e) {
                            console.error("Error parsing metrics:", e);
                            return <p>Loading metrics...</p>;
                          }
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Pending Oracle Queries */}
                  {pendingQueries.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center">
                        🤔 Oracle Queries ({pendingQueries.length} remaining)
                      </h4>

                      {/* Help Information */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <h5 className="font-medium text-blue-900 mb-3 flex items-center">
                          💡 How to Answer Queries:
                        </h5>
                        <div className="text-sm text-blue-800 space-y-2">
                          <div className="bg-white p-3 rounded border">
                            <p className="font-medium text-blue-900 mb-1">
                              🎯 <strong>Membership Query:</strong>
                            </p>
                            <p>
                              "Is this item a pizza?" → Answer{" "}
                              <strong>Yes</strong> if it should be categorized
                              as a pizza,
                              <strong> No</strong> otherwise. Provide oracle
                              feedback to guide the learning process.
                            </p>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <p className="font-medium text-blue-900 mb-1">
                              🔍 <strong>Equivalence Query:</strong>
                            </p>
                            <p>
                              "Is my hypothesis correct?" → If the hypothesis
                              correctly categorizes all items, say{" "}
                              <strong>"correct"</strong>. Otherwise, provide a{" "}
                              <strong>counterexample</strong>
                              item name that the hypothesis categorizes
                              incorrectly.
                            </p>
                          </div>
                        </div>
                      </div>

                      {pendingQueries.length > 0 &&
                        (() => {
                          const query = pendingQueries[currentQueryIndex];
                          if (!query) return null;

                          const queryData = JSON.parse(query.queryData);

                          return (
                            <div className="border-2 border-yellow-300 rounded-lg p-4 bg-gradient-to-r from-yellow-50 to-orange-50">
                              <div className="flex items-center justify-between mb-3">
                                <Badge
                                  variant="outline"
                                  className="capitalize bg-yellow-100 text-yellow-800 border-yellow-300"
                                >
                                  {query.queryType === "membership"
                                    ? "🎯 Membership"
                                    : "🔍 Equivalence"}{" "}
                                  Query
                                </Badge>
                                <span className="text-sm text-gray-600">
                                  <span className="font-medium">
                                    Question {currentQueryIndex + 1}
                                  </span>{" "}
                                  of {pendingQueries.length}
                                  {queryData.progress && (
                                    <span className="ml-2 text-blue-600 font-medium">
                                      (M: {queryData.progress.membershipQueries}
                                      /{queryData.progress.maxMembershipQueries}
                                      , E:{" "}
                                      {queryData.progress.equivalenceQueries}/
                                      {queryData.progress.maxEquivalenceQueries}
                                      )
                                    </span>
                                  )}
                                </span>
                              </div>

                              <div className="bg-white p-3 rounded mb-3 border">
                                {query.queryType === "membership" ? (
                                  <div className="text-sm">
                                    <p className="font-medium mb-3 text-lg text-center bg-blue-50 p-2 rounded border">
                                      {queryData.question}
                                    </p>
                                    <p className="text-gray-600 mb-3 text-center">
                                      Answer <strong>Yes</strong> if it should
                                      be categorized as a {queryData.category},{" "}
                                      <strong>No</strong> otherwise.
                                    </p>
                                  </div>
                                ) : (
                                  <div className="text-sm">
                                    <p className="font-medium mb-3 text-center">
                                      🔍 Review the hypothesis:
                                    </p>
                                    <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-32 border">
                                      {JSON.stringify(
                                        queryData.hypothesis,
                                        null,
                                        2
                                      )}
                                    </pre>
                                    <p className="text-gray-600 mt-3 text-center bg-purple-50 p-2 rounded border">
                                      {queryData.instruction}
                                    </p>
                                  </div>
                                )}
                              </div>

                              {query.queryType === "membership" && (
                                <div className="flex space-x-3">
                                  <Button
                                    onClick={() =>
                                      handleAnswerQuery(query.id, "true")
                                    }
                                    className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3"
                                  >
                                    <Check className="h-5 w-5 mr-2" />✅ Yes,
                                    it's a pizza!
                                  </Button>
                                  <Button
                                    onClick={() =>
                                      handleAnswerQuery(query.id, "false")
                                    }
                                    className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white font-medium py-3"
                                  >
                                    <X className="h-5 w-5 mr-2" />❌ No, it's
                                    not a pizza
                                  </Button>
                                </div>
                              )}

                              {query.queryType === "equivalence" && (
                                <div className="space-y-3">
                                  <div className="bg-blue-50 p-3 rounded border">
                                    <p className="text-sm text-blue-800 mb-2">
                                      <strong>
                                        💡 Counterexample guidance:
                                      </strong>{" "}
                                      If the hypothesis is wrong, provide an
                                      item name that it categorizes incorrectly.
                                    </p>
                                    <div className="text-xs text-blue-700 space-y-1">
                                      <p>
                                        <strong>Examples:</strong>
                                      </p>
                                      <p>
                                        • If "Margherita Pizza" should be a
                                        pizza but hypothesis says it's not →
                                        counterexample: "Margherita Pizza"
                                      </p>
                                      <p>
                                        • If "Coke" should NOT be a pizza but
                                        hypothesis says it is → counterexample:
                                        "Coke"
                                      </p>
                                      <p>
                                        • If hypothesis is correct for all items
                                        → leave empty and click "Correct"
                                      </p>
                                    </div>
                                  </div>
                                  <input
                                    type="text"
                                    placeholder="Enter counterexample (or leave empty if correct)..."
                                    value={oracleResponse}
                                    onChange={(e) =>
                                      setOracleResponse(e.target.value)
                                    }
                                    className="w-full p-3 border rounded text-sm"
                                  />
                                  <div className="flex space-x-3">
                                    <Button
                                      onClick={() =>
                                        handleAnswerQuery(
                                          query.id,
                                          oracleResponse || "correct"
                                        )
                                      }
                                      className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-medium py-3"
                                    >
                                      🚀 Submit Answer
                                    </Button>
                                    <Button
                                      onClick={() =>
                                        handleAnswerQuery(query.id, "correct")
                                      }
                                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium py-3 px-6"
                                    >
                                      ✅ Hypothesis is Correct
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                    </div>
                  )}

                  {/* Run Algorithm */}
                  <Button
                    onClick={handleRunAlgorithm}
                    disabled={algorithmLoading || pendingQueries.length > 0}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium py-3"
                  >
                    {algorithmLoading ? (
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    ) : (
                      <Brain className="h-5 w-5 mr-2" />
                    )}
                    {algorithmLoading
                      ? "🧠 Running Angluin's Algorithm..."
                      : "🚀 Start Learning Method"}
                  </Button>

                  {/* Learned DFA */}
                  {selectedSessionData?.learnedDFA && (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-900 mb-3 flex items-center">
                        🎯 Learned DFA (Deterministic Finite Automaton)
                      </h4>
                      <p className="text-sm text-green-700 mb-3">
                        This is the final learned DFA that represents the
                        categorization rules. The algorithm has successfully
                        converged to the target language!
                      </p>
                      <div className="bg-white p-3 rounded max-h-64 overflow-auto border">
                        <pre className="text-xs break-all">
                          {JSON.stringify(
                            selectedSessionData.learnedDFA,
                            null,
                            2
                          )}
                        </pre>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default App;
