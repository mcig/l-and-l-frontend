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
  Plus,
  Brain,
  TestTube,
  BookOpen,
  FlaskConical,
  Target,
  Zap,
  Star,
  Trophy,
  CheckCircle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import AngluinDemo from "./AngluinDemo";

// GraphQL queries and mutations
const GET_LEARNING_SESSIONS = gql`
  query GetLearningSessions {
    allLearningSessions {
      id
      name
      description
      status
      createdAt
      hypotheses {
        id
        description
        confidence
        status
      }
      examples {
        id
        type
      }
    }
  }
`;

const CREATE_LEARNING_SESSION = gql`
  mutation CreateLearningSession($data: LearningSessionInput!) {
    createLearningSession(data: $data) {
      id
      name
      description
      status
    }
  }
`;

const ADD_EXAMPLE = gql`
  mutation AddExample($data: ExampleInput!) {
    addExample(data: $data) {
      id
      sourceData
      targetData
      type
    }
  }
`;

const GENERATE_HYPOTHESIS = gql`
  mutation GenerateHypothesis($sessionId: Int!) {
    generateHypothesis(sessionId: $sessionId)
  }
`;

const TEST_HYPOTHESIS = gql`
  mutation TestHypothesis($hypothesisId: Int!) {
    testHypothesis(hypothesisId: $hypothesisId)
  }
`;

const GET_PENDING_ORACLE_QUERIES = gql`
  query GetPendingOracleQueries($sessionId: Int!) {
    pendingOracleQueries(sessionId: $sessionId) {
      id
      queryType
      queryData
      status
      createdAt
    }
  }
`;

const ANSWER_ORACLE_QUERY = gql`
  mutation AnswerOracleQuery($queryId: Int!, $response: String!) {
    answerOracleQuery(queryId: $queryId, response: $response)
  }
`;

const GET_SESSION_DETAILS = gql`
  query GetSessionDetails($sessionId: Int!) {
    learningSessionById(id: $sessionId) {
      id
      name
      description
      status
      hypotheses {
        id
        description
        functionCode
        confidence
        status
        createdAt
        examples {
          id
          sourceData
          targetData
          type
        }
        counterexamples {
          id
          sourceData
          errorMessage
        }
      }
      examples {
        id
        sourceData
        targetData
        type
        createdAt
      }
      oracleQueries {
        id
        queryType
        queryData
        response
        status
        createdAt
      }
    }
  }
`;

export default function AngluinLearning() {
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [newSessionName, setNewSessionName] = useState("");
  const [newSessionDescription, setNewSessionDescription] = useState("");
  const [newExampleSource, setNewExampleSource] = useState("");
  const [newExampleTarget, setNewExampleTarget] = useState("");
  const [newExampleType, setNewExampleType] = useState("positive");
  const [showCelebration, setShowCelebration] = useState(false);
  const [oracleResponse, setOracleResponse] = useState("");
  const [selectedQueryId, setSelectedQueryId] = useState<number | null>(null);

  const {
    data: sessionsData,
    loading: sessionsLoading,
    error: sessionsError,
  } = useQuery(GET_LEARNING_SESSIONS);

  const { data: sessionDetails } = useQuery(GET_SESSION_DETAILS, {
    variables: { sessionId: selectedSession },
    skip: !selectedSession,
  });

  const [createSession, { loading: createLoading }] = useMutation(
    CREATE_LEARNING_SESSION,
    {
      refetchQueries: [{ query: GET_LEARNING_SESSIONS }],
    }
  );

  const [addExample, { loading: exampleLoading }] = useMutation(ADD_EXAMPLE, {
    refetchQueries: [
      { query: GET_SESSION_DETAILS, variables: { sessionId: selectedSession } },
    ],
  });

  const [generateHypothesis, { loading: generateLoading }] = useMutation(
    GENERATE_HYPOTHESIS,
    {
      refetchQueries: [
        {
          query: GET_SESSION_DETAILS,
          variables: { sessionId: selectedSession },
        },
      ],
    }
  );

  const [testHypothesis, { loading: testLoading }] = useMutation(
    TEST_HYPOTHESIS,
    {
      refetchQueries: [
        {
          query: GET_SESSION_DETAILS,
          variables: { sessionId: selectedSession },
        },
      ],
    }
  );

  const [answerOracleQuery, { loading: oracleLoading }] = useMutation(
    ANSWER_ORACLE_QUERY,
    {
      refetchQueries: [
        {
          query: GET_SESSION_DETAILS,
          variables: { sessionId: selectedSession },
        },
      ],
    }
  );

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;

    try {
      await createSession({
        variables: {
          data: {
            name: newSessionName,
            description: newSessionDescription,
          },
        },
      });
      setNewSessionName("");
      setNewSessionDescription("");
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 3000);
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  const handleAddExample = async () => {
    if (!selectedSession || !newExampleSource || !newExampleTarget) return;

    try {
      await addExample({
        variables: {
          data: {
            sessionId: selectedSession,
            sourceData: newExampleSource,
            targetData: newExampleTarget,
            type: newExampleType,
          },
        },
      });
      setNewExampleSource("");
      setNewExampleTarget("");
    } catch (error) {
      console.error("Error adding example:", error);
    }
  };

  const handleGenerateHypothesis = async () => {
    if (!selectedSession) return;

    try {
      await generateHypothesis({
        variables: { sessionId: selectedSession },
      });
    } catch (error) {
      console.error("Error generating hypothesis:", error);
    }
  };

  const handleTestHypothesis = async (hypothesisId: number) => {
    try {
      await testHypothesis({
        variables: { hypothesisId },
      });
    } catch (error) {
      console.error("Error testing hypothesis:", error);
    }
  };

  const handleAnswerOracleQuery = async () => {
    if (!selectedQueryId || !oracleResponse.trim()) return;

    try {
      await answerOracleQuery({
        variables: {
          queryId: selectedQueryId,
          response: oracleResponse,
        },
      });
      setOracleResponse("");
      setSelectedQueryId(null);
    } catch (error) {
      console.error("Error answering oracle query:", error);
    }
  };

  if (sessionsLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-600" />
          <p className="text-lg font-medium">
            🔬 Loading your learning sessions...
          </p>
          <p className="text-sm text-muted-foreground">Preparing the lab! 🧪</p>
        </div>
      </div>
    );
  }

  if (sessionsError) {
    return (
      <Alert variant="destructive" className="mb-6">
        <XCircle className="h-4 w-4" />
        <AlertDescription>{sessionsError.message}</AlertDescription>
      </Alert>
    );
  }

  const sessions = sessionsData?.allLearningSessions || [];

  return (
    <div className="space-y-6 relative">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 animate-bounce">
              <Trophy className="h-24 w-24 text-yellow-500 mx-auto" />
              <div className="text-4xl">🎉</div>
              <p className="text-2xl font-bold text-purple-600">
                Session Created!
              </p>
            </div>
          </div>
          <div className="absolute top-1/4 left-1/4 text-4xl animate-ping">
            ⭐
          </div>
          <div className="absolute top-1/3 right-1/4 text-4xl animate-ping delay-300">
            🎊
          </div>
          <div className="absolute bottom-1/3 left-1/3 text-4xl animate-ping delay-500">
            🏆
          </div>
        </div>
      )}

      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <FlaskConical className="h-8 w-8 text-blue-600" />
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-slate-700 bg-clip-text text-transparent">
            Angluin's Method Learning Lab
          </h2>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Create learning sessions, add examples, and watch the AI generate
          mapping hypotheses! It's like having your own AI research lab!
        </p>
      </div>

      <Tabs defaultValue="sessions" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-white/80 backdrop-blur-sm border border-gray-200">
          <TabsTrigger
            value="sessions"
            className="flex items-center space-x-2 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <BookOpen className="h-4 w-4" />
            <span>Sessions</span>
          </TabsTrigger>
          <TabsTrigger
            value="examples"
            className="flex items-center space-x-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
          >
            <Target className="h-4 w-4" />
            <span>Examples</span>
          </TabsTrigger>
          <TabsTrigger
            value="hypotheses"
            className="flex items-center space-x-2 data-[state=active]:bg-slate-50 data-[state=active]:text-slate-700"
          >
            <Brain className="h-4 w-4" />
            <span>Hypotheses</span>
          </TabsTrigger>
          <TabsTrigger
            value="oracle"
            className="flex items-center space-x-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
          >
            <FlaskConical className="h-4 w-4" />
            <span>Oracle</span>
          </TabsTrigger>
          <TabsTrigger
            value="demo"
            className="flex items-center space-x-2 data-[state=active]:bg-amber-50 data-[state=active]:text-amber-700"
          >
            <Zap className="h-4 w-4" />
            <span>Demo</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-6">
          <div className="grid gap-6">
            <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-slate-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-700">
                  <Plus className="h-6 w-6" />
                  <span>Create New Learning Session</span>
                </CardTitle>
                <CardDescription className="text-lg">
                  Start a new learning session to begin your schema mapping
                  adventure!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label
                      htmlFor="sessionName"
                      className="text-lg font-medium"
                    >
                      Session Name
                    </Label>
                    <Input
                      id="sessionName"
                      placeholder="e.g., Menu System Migration"
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      className="h-12 text-lg"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      htmlFor="sessionDescription"
                      className="text-lg font-medium"
                    >
                      Description
                    </Label>
                    <Input
                      id="sessionDescription"
                      placeholder="Describe the learning goal"
                      value={newSessionDescription}
                      onChange={(e) => setNewSessionDescription(e.target.value)}
                      className="h-12 text-lg"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handleCreateSession}
                  disabled={createLoading}
                  className="h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105"
                >
                  {createLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-5 w-5" />
                      Create Session
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-slate-700">
                  <BookOpen className="h-6 w-6" />
                  <span>Learning Sessions</span>
                </CardTitle>
                <CardDescription className="text-lg">
                  Your active and completed learning sessions. Click to explore!
                </CardDescription>
              </CardHeader>
              <CardContent>
                {sessions.length > 0 ? (
                  <div className="grid gap-4">
                    {sessions.map((session: unknown) => (
                      <div
                        key={(session as any).id}
                        className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                          selectedSession === (session as any).id
                            ? "border-slate-500 bg-slate-100 shadow-lg"
                            : "border-gray-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                        }`}
                        onClick={() => setSelectedSession((session as any).id)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-bold text-xl">
                                {(session as any).name}
                              </h3>
                              <Badge
                                variant={
                                  (session as any).status === "active"
                                    ? "default"
                                    : (session as any).status === "completed"
                                    ? "secondary"
                                    : "outline"
                                }
                                className="text-sm"
                              >
                                {(session as any).status === "active"
                                  ? "🟢"
                                  : "🔵"}{" "}
                                {(session as any).status}
                              </Badge>
                            </div>
                            <p className="text-muted-foreground">
                              {(session as any).description}
                            </p>
                            <div className="flex gap-3">
                              <Badge
                                variant="outline"
                                className="bg-blue-100 text-blue-800"
                              >
                                {(session as any).hypotheses.length} hypotheses
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-green-100 text-green-800"
                              >
                                {(session as any).examples.length} examples
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-slate-100 text-slate-800"
                              >
                                {new Date(
                                  (session as any).createdAt
                                ).toLocaleDateString()}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-2xl">👉</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="text-6xl mb-4">🔬</div>
                    <p className="text-lg font-medium">
                      No learning sessions yet
                    </p>
                    <p className="text-sm">
                      Create one to start your AI learning adventure!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="examples" className="space-y-6">
          {selectedSession ? (
            <div className="space-y-6">
              <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-700">
                    <Target className="h-6 w-6" />
                    <span>Add Training Examples</span>
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Add positive or negative examples to help the AI learn the
                    transformation patterns!
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="exampleType"
                        className="text-lg font-medium"
                      >
                        Example Type
                      </Label>
                      <select
                        id="exampleType"
                        className="w-full p-3 border-2 rounded-lg text-lg"
                        value={newExampleType}
                        onChange={(e) => setNewExampleType(e.target.value)}
                      >
                        <option value="positive">Positive</option>
                        <option value="negative">Negative</option>
                        <option value="counterexample">Counterexample</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="sourceData"
                        className="text-lg font-medium"
                      >
                        Source Data (JSON)
                      </Label>
                      <textarea
                        id="sourceData"
                        rows={4}
                        className="w-full p-3 border-2 rounded-lg font-mono text-sm"
                        placeholder='{"name": "Margherita Pizza", "price": 9.99, "category": "Pizza"}'
                        value={newExampleSource}
                        onChange={(e) => setNewExampleSource(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label
                        htmlFor="targetData"
                        className="text-lg font-medium"
                      >
                        Target Data (JSON)
                      </Label>
                      <textarea
                        id="targetData"
                        rows={4}
                        className="w-full p-3 border-2 rounded-lg font-mono text-sm"
                        placeholder='{"title": "Margherita", "price": 9.99, "category": "Pizza"}'
                        value={newExampleTarget}
                        onChange={(e) => setNewExampleTarget(e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={handleAddExample}
                    disabled={exampleLoading}
                    className="h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105"
                  >
                    {exampleLoading && (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    )}
                    <Target className="mr-2 h-5 w-5" />
                    Add Example
                  </Button>
                </CardFooter>
              </Card>

              {/* Show existing examples */}
              {sessionDetails?.learningSessionById?.examples && (
                <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-slate-50">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-blue-700">
                      <CheckCircle className="h-6 w-6" />
                      <span>
                        Current Examples (
                        {sessionDetails.learningSessionById.examples.length})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {sessionDetails.learningSessionById.examples.map(
                        (example: unknown) => (
                          <div
                            key={(example as any).id}
                            className="p-4 bg-white rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <Badge
                                variant="outline"
                                className={`${
                                  (example as any).type === "positive"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {(example as any).type === "positive"
                                  ? "✅"
                                  : "❌"}{" "}
                                {(example as any).type}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(
                                  (example as any).createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-sm font-medium text-gray-600">
                                  Source:
                                </Label>
                                <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                  {(example as any).sourceData}
                                </pre>
                              </div>
                              <div>
                                <Label className="text-sm font-medium text-gray-600">
                                  Target:
                                </Label>
                                <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                  {(example as any).targetData}
                                </pre>
                              </div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card className="border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-lg font-medium">
                  Select a learning session first
                </p>
                <p className="text-sm text-muted-foreground">
                  Choose a session from the Sessions tab to add examples
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="hypotheses" className="space-y-6">
          {selectedSession &&
          sessionDetails?.learningSessionById?.hypotheses ? (
            <div className="space-y-6">
              <Card className="border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-slate-700">
                    <Brain className="h-6 w-6" />
                    <span>Generated Hypotheses</span>
                  </CardTitle>
                  <CardDescription className="text-lg">
                    AI-generated transformation functions based on your
                    examples!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {sessionDetails.learningSessionById.hypotheses.map(
                      (hypothesis: unknown) => (
                        <div
                          key={(hypothesis as any).id}
                          className="p-6 bg-white rounded-lg border-2 border-slate-200"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <Badge
                                variant="outline"
                                className="bg-slate-100 text-slate-800"
                              >
                                Confidence:{" "}
                                {((hypothesis as any).confidence * 100).toFixed(
                                  1
                                )}
                                %
                              </Badge>
                              <Badge
                                variant="outline"
                                className="bg-blue-100 text-blue-800"
                              >
                                {(hypothesis as any).status}
                              </Badge>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Star className="h-5 w-5 text-amber-500" />
                              <span className="text-sm text-muted-foreground">
                                {new Date(
                                  (hypothesis as any).createdAt
                                ).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <Label className="text-lg font-medium">
                                Generated Function:
                              </Label>
                              <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded-lg text-sm overflow-x-auto border border-green-300">
                                {(hypothesis as any).functionCode}
                              </pre>
                            </div>

                            <div className="flex space-x-4">
                              <Button
                                onClick={() =>
                                  handleTestHypothesis((hypothesis as any).id)
                                }
                                disabled={testLoading}
                                className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800"
                              >
                                {testLoading && (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                <TestTube className="mr-2 h-4 w-4" />
                                Test Hypothesis
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-700">
                    <Zap className="h-6 w-6" />
                    <span>Generate New Hypothesis</span>
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Create a new hypothesis based on your current examples!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleGenerateHypothesis}
                    disabled={generateLoading}
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105"
                  >
                    {generateLoading && (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    )}
                    <Brain className="mr-2 h-5 w-5" />
                    Generate Hypothesis
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">🧠</div>
                <p className="text-lg font-medium">No hypotheses yet</p>
                <p className="text-sm text-muted-foreground">
                  Add examples and generate hypotheses to see them here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="oracle" className="space-y-6">
          {selectedSession ? (
            <div className="space-y-6">
              <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-purple-700">
                    <FlaskConical className="h-6 w-6" />
                    <span>Angluin's Oracle Queries</span>
                  </CardTitle>
                  <CardDescription className="text-lg">
                    Answer membership and equivalence queries for Angluin's L*
                    algorithm!
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {sessionDetails?.learningSessionById?.oracleQueries?.length >
                  0 ? (
                    <div className="space-y-4">
                      {sessionDetails.learningSessionById.oracleQueries
                        .filter((query: any) => query.status === "pending")
                        .map((query: any) => (
                          <div
                            key={query.id}
                            className="p-4 bg-white rounded-lg border-2 border-purple-200"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <Badge
                                variant="outline"
                                className={`${
                                  query.queryType === "membership"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-green-100 text-green-800"
                                }`}
                              >
                                {query.queryType === "membership"
                                  ? "Membership Query"
                                  : "Equivalence Query"}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(query.createdAt).toLocaleString()}
                              </span>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <Label className="text-sm font-medium">
                                  Query Data:
                                </Label>
                                <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                                  {query.queryData}
                                </pre>
                              </div>

                              {query.queryType === "membership" ? (
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Is this a valid transformation? (true/false)
                                  </Label>
                                  <div className="flex space-x-2">
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedQueryId(query.id);
                                        setOracleResponse("true");
                                        handleAnswerOracleQuery();
                                      }}
                                      disabled={oracleLoading}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      Yes (true)
                                    </Button>
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        setSelectedQueryId(query.id);
                                        setOracleResponse("false");
                                        handleAnswerOracleQuery();
                                      }}
                                      disabled={oracleLoading}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      No (false)
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <Label className="text-sm font-medium">
                                    Provide counterexample or confirm
                                    equivalence:
                                  </Label>
                                  <div className="flex space-x-2">
                                    <Input
                                      placeholder="Enter counterexample JSON or 'equivalent'"
                                      value={
                                        selectedQueryId === query.id
                                          ? oracleResponse
                                          : ""
                                      }
                                      onChange={(e) => {
                                        setSelectedQueryId(query.id);
                                        setOracleResponse(e.target.value);
                                      }}
                                      className="flex-1"
                                    />
                                    <Button
                                      onClick={() => handleAnswerOracleQuery()}
                                      disabled={
                                        oracleLoading || !oracleResponse.trim()
                                      }
                                      className="bg-purple-600 hover:bg-purple-700"
                                    >
                                      {oracleLoading && (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      )}
                                      Answer
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                      {sessionDetails.learningSessionById.oracleQueries.filter(
                        (query: any) => query.status !== "pending"
                      ).length > 0 && (
                        <div className="mt-6">
                          <h3 className="text-lg font-medium mb-3">
                            Answered Queries
                          </h3>
                          <div className="space-y-2">
                            {sessionDetails.learningSessionById.oracleQueries
                              .filter(
                                (query: any) => query.status !== "pending"
                              )
                              .map((query: any) => (
                                <div
                                  key={query.id}
                                  className="p-3 bg-gray-50 rounded border"
                                >
                                  <div className="flex items-center justify-between">
                                    <Badge
                                      variant="outline"
                                      className={`${
                                        query.queryType === "membership"
                                          ? "bg-blue-100 text-blue-800"
                                          : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {query.queryType === "membership"
                                        ? "Membership"
                                        : "Equivalence"}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground">
                                      Response: {query.response}
                                    </span>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🔮</div>
                      <p className="text-lg font-medium">
                        No oracle queries yet
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Generate a hypothesis using Angluin's algorithm to see
                        oracle queries
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="border-2 border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">🔮</div>
                <p className="text-lg font-medium">
                  Select a learning session first
                </p>
                <p className="text-sm text-muted-foreground">
                  Choose a session from the Sessions tab to view oracle queries
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="demo">
          <AngluinDemo />
        </TabsContent>
      </Tabs>

      {/* Fun Stats */}
      {sessions.length > 0 && (
        <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-amber-700">
              <TrendingUp className="h-6 w-6" />
              <span>Learning Stats</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-white rounded-lg border border-amber-200">
                <div className="text-3xl font-bold text-slate-700">
                  {sessions.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Sessions
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-amber-200">
                <div className="text-3xl font-bold text-blue-600">
                  {sessions.reduce(
                    (acc: number, session: unknown) =>
                      acc + (session as any).examples.length,
                    0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Examples
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-amber-200">
                <div className="text-3xl font-bold text-green-600">
                  {sessions.reduce(
                    (acc: number, session: unknown) =>
                      acc + (session as any).hypotheses.length,
                    0
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Hypotheses
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
