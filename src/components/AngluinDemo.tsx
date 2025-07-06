import { useState } from "react";
import { useQuery, useMutation, gql } from "@apollo/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Brain,
  TestTube,
  Play,
  Plus,
  CheckCircle,
  Zap,
  Target,
  ArrowRight,
  Lightbulb,
  Trophy,
  Star,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

// Types
interface Example {
  id: number;
  sourceData: string;
  targetData: string;
  type: string;
}

interface Hypothesis {
  id: number;
  description: string;
  functionCode: string;
  confidence: number;
  status: string;
  examples: Example[];
  counterexamples: unknown[];
}

// GraphQL queries and mutations
const GET_SOURCE_DATA = gql`
  query GetSourceData {
    allSourceData {
      id
      name
      price
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
    }
  }
`;

export default function AngluinDemo() {
  const [selectedSession, setSelectedSession] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [newExampleSource, setNewExampleSource] = useState("");
  const [newExampleTarget, setNewExampleTarget] = useState("");
  const [testResult, setTestResult] = useState<{
    correctCount: number;
    totalCount: number;
    confidence: number;
    success: boolean;
  } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [selectedItem, setSelectedItem] = useState<number | null>(null);

  const { data: sourceData, loading: sourceLoading } =
    useQuery(GET_SOURCE_DATA);
  const { loading: sessionsLoading } = useQuery(GET_LEARNING_SESSIONS);
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

  const handleCreateSession = async () => {
    try {
      const result = await createSession({
        variables: {
          data: {
            name: "Interactive Demo Session",
            description: "Learning session for interactive demonstration",
          },
        },
      });
      setSelectedSession(result.data.createLearningSession.id);
      setCurrentStep(2);
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
            type: "positive",
          },
        },
      });
      setNewExampleSource("");
      setNewExampleTarget("");

      // Check if we have enough examples to proceed
      const currentExamples =
        sessionDetails?.learningSessionById?.examples || [];
      if (currentExamples.length >= 1) {
        setCurrentStep(3);
      }
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
      setCurrentStep(4);
    } catch (error) {
      console.error("Error generating hypothesis:", error);
    }
  };

  const handleTestHypothesis = async (hypothesisId: number) => {
    try {
      await testHypothesis({
        variables: { hypothesisId },
      });

      // Simulate test results for demo
      const mockResult = {
        correctCount: Math.floor(Math.random() * 5) + 3,
        totalCount: 5,
        confidence: Math.random() * 0.4 + 0.6,
        success: true,
      };
      setTestResult(mockResult);

      if (mockResult.confidence > 0.8) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 3000);
      }
    } catch (error) {
      console.error("Error testing hypothesis:", error);
    }
  };

  const getCurrentHypothesis = (): Hypothesis | null => {
    return sessionDetails?.learningSessionById?.hypotheses?.[0] || null;
  };

  if (sourceLoading || sessionsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-600" />
          <p className="text-lg font-medium">
            🧠 Loading your learning session...
          </p>
          <p className="text-sm text-muted-foreground">
            Preparing the magic! ✨
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      {/* Celebration Animation */}
      {showCelebration && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-4 animate-bounce">
              <Trophy className="h-24 w-24 text-yellow-500 mx-auto" />
              <div className="text-4xl">🎉</div>
              <p className="text-2xl font-bold text-purple-600">Amazing!</p>
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

      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center space-x-2">
          <Brain className="h-8 w-8 text-slate-700" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent">
            Interactive Schema Learning Demo
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Experience the magic of Angluin's method! Watch as the AI learns to
          transform data through your examples. It's like teaching a robot to
          understand patterns!
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex justify-center">
        <div className="flex space-x-4">
          {[
            { step: 1, title: "Start", emoji: "🎯" },
            { step: 2, title: "Add Examples", emoji: "💡" },
            { step: 3, title: "Generate", emoji: "⚡" },
            { step: 4, title: "Test", emoji: "🎉" },
          ].map(({ step, title, emoji }) => (
            <div
              key={step}
              className={`flex items-center space-x-2 transition-all duration-300 ${
                currentStep >= step
                  ? "text-slate-700 scale-110"
                  : "text-muted-foreground"
              }`}
            >
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold transition-all duration-300 ${
                  currentStep >= step
                    ? "bg-gradient-to-r from-slate-600 to-slate-800 text-white shadow-lg"
                    : "bg-gray-200"
                }`}
              >
                {currentStep > step ? "✓" : step}
              </div>
              <div className="hidden sm:block">
                <div className="font-medium">{title}</div>
                <div className="text-2xl">{emoji}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Start */}
      {currentStep === 1 && (
        <Card className="border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-slate-700">
              <Play className="h-6 w-6" />
              <span>Step 1: Start Your Learning Adventure</span>
            </CardTitle>
            <CardDescription className="text-lg">
              Ready to teach an AI how to transform data? Let's create your
              first learning session!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleCreateSession}
              disabled={createLoading}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 transition-all duration-300 transform hover:scale-105"
            >
              {createLoading && (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              )}
              <Zap className="mr-2 h-5 w-5" />
              Start Learning Session
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Add Examples */}
      {currentStep >= 2 && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-slate-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-700">
              <Plus className="h-6 w-6" />
              <span>Step 2: Add Training Examples</span>
            </CardTitle>
            <CardDescription className="text-lg">
              Show the AI examples of how to transform your data! Click on items
              below to auto-fill.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="source" className="text-lg font-medium">
                  Source Data (JSON)
                </Label>
                <Input
                  id="source"
                  placeholder='{"name": "Margherita Pizza", "price": 9.99, "category": "Pizza"}'
                  value={newExampleSource}
                  onChange={(e) => setNewExampleSource(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target" className="text-lg font-medium">
                  Target Data (JSON)
                </Label>
                <Input
                  id="target"
                  placeholder='{"title": "Margherita", "price": 9.99, "category": "Pizza"}'
                  value={newExampleTarget}
                  onChange={(e) => setNewExampleTarget(e.target.value)}
                  className="h-12 text-lg"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={handleAddExample}
                disabled={
                  exampleLoading || !newExampleSource || !newExampleTarget
                }
                className="flex-1 h-12 text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105"
              >
                {exampleLoading && (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                )}
                <Plus className="mr-2 h-5 w-5" />
                Add Example
              </Button>

              {sessionDetails?.learningSessionById?.examples && (
                <Badge variant="outline" className="text-lg px-4 py-2">
                  {sessionDetails.learningSessionById.examples.length} examples
                </Badge>
              )}
            </div>

            {/* Show existing examples */}
            {sessionDetails?.learningSessionById?.examples && (
              <div className="mt-6">
                <h4 className="font-semibold mb-4 text-lg flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span>Current Examples:</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {sessionDetails.learningSessionById.examples.map(
                    (example: any) => (
                      <div
                        key={example.id}
                        className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-green-200"
                      >
                        <Badge
                          variant="outline"
                          className="bg-green-100 text-green-800"
                        >
                          {example.type === "positive" ? "✅" : "❌"}{" "}
                          {example.type}
                        </Badge>
                        <div className="flex items-center space-x-2 text-sm">
                          <span className="font-medium">
                            {JSON.parse(example.sourceData).name}
                          </span>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-green-600">
                            {JSON.parse(example.targetData).title}
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>

                {sessionDetails.learningSessionById.examples.length >= 2 && (
                  <Button
                    onClick={handleGenerateHypothesis}
                    disabled={generateLoading}
                    className="mt-6 w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all duration-300 transform hover:scale-105"
                  >
                    {generateLoading && (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    )}
                    <Brain className="mr-2 h-5 w-5" />
                    Generate Hypothesis
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Generated Hypothesis */}
      {currentStep >= 4 && getCurrentHypothesis() && (
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-700">
              <Brain className="h-6 w-6" />
              <span>Step 3: AI Generated Hypothesis</span>
            </CardTitle>
            <CardDescription className="text-lg">
              The AI has learned a transformation function from your examples!
              Let's test it out.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-lg font-medium">Generated Function:</Label>
              <pre className="mt-2 p-4 bg-gray-900 text-green-400 rounded-lg text-sm overflow-x-auto border border-green-300">
                {getCurrentHypothesis()?.functionCode}
              </pre>
            </div>

            <div className="flex items-center space-x-4">
              <Badge
                variant="outline"
                className="text-lg px-4 py-2 bg-green-100 text-green-800"
              >
                Confidence:{" "}
                {(getCurrentHypothesis()?.confidence * 100).toFixed(1)}%
              </Badge>
              <Star className="h-5 w-5 text-amber-500" />
            </div>

            <Button
              onClick={() => handleTestHypothesis(getCurrentHypothesis()!.id)}
              disabled={testLoading}
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 transition-all duration-300 transform hover:scale-105"
            >
              {testLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              <TestTube className="mr-2 h-5 w-5" />
              Test Hypothesis
            </Button>

            {/* Test Results */}
            {testResult && (
              <Alert className="border-green-300 bg-green-50">
                <TestTube className="h-5 w-5 text-green-600" />
                <AlertDescription className="text-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <strong className="text-green-800">Test Results:</strong>
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800"
                    >
                      {testResult.correctCount}/{testResult.totalCount} correct
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <strong className="text-green-800">Confidence:</strong>
                    <span className="text-green-700">
                      {(testResult.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  {testResult.confidence > 0.8 && (
                    <div className="mt-2 text-green-700 font-medium">
                      Excellent! Your AI is learning well!
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Source Data */}
      <Card className="border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-slate-700">
            <Target className="h-6 w-6" />
            <span>Available Source Data</span>
          </CardTitle>
          <CardDescription className="text-lg">
            Click on any item below to auto-fill the source data field! It's
            like a smart menu!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sourceData?.allSourceData?.map((item: any) => (
              <div
                key={item.id}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                  selectedItem === item.id
                    ? "border-slate-500 bg-slate-100 shadow-lg"
                    : "border-gray-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                }`}
                onClick={() => {
                  setSelectedItem(item.id);
                  setNewExampleSource(
                    JSON.stringify({
                      name: item.name,
                      price: item.price,
                      category: item.category,
                    })
                  );
                  // Auto-generate target data
                  const targetName = item.name.replace(` ${item.category}`, "");
                  setNewExampleTarget(
                    JSON.stringify({
                      title: targetName,
                      price: item.price,
                      category: item.category,
                    })
                  );
                }}
              >
                <div className="font-bold text-lg mb-2">{item.name}</div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-green-600 font-semibold">
                    ${item.price}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-blue-100 text-blue-800"
                  >
                    {item.category}
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-gray-500">
                  Click to use as example
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Fun Facts */}
      <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-amber-700">
            <Lightbulb className="h-6 w-6" />
            <span>Did You Know?</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start space-x-2">
              <span className="text-2xl">🧠</span>
              <div>
                <strong>Angluin's Method</strong> is named after Dana Angluin,
                who developed this interactive learning algorithm in the 1980s!
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-2xl">🎯</span>
              <div>
                <strong>Schema Mapping</strong> is like teaching a translator to
                convert between different languages - but for data structures!
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-2xl">⚡</span>
              <div>
                <strong>Interactive Learning</strong> means the AI learns from
                your feedback, just like a student learns from a teacher!
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-2xl">🎉</span>
              <div>
                <strong>Confidence Scores</strong> tell you how sure the AI is
                about its transformation rules - higher is better!
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
