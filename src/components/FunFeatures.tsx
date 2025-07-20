import { useState, useEffect } from "react";
import { useQuery, gql } from "@apollo/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Trophy,
  TrendingUp,
  Star,
  Brain,
  Target,
  Zap,
  Lightbulb,
  Award,
  Activity,
  Users,
  BarChart3,
} from "lucide-react";

const GET_GLOBAL_STATS = gql`
  query GetGlobalStats {
    globalStats
  }
`;

const GET_FUN_FACTS = gql`
  query GetFunFacts {
    funFacts
  }
`;

const GET_SESSION_STATS = gql`
  query GetSessionStats($sessionId: Int!) {
    sessionStats(sessionId: $sessionId)
  }
`;

const GET_ACHIEVEMENTS = gql`
  query GetAchievements($sessionId: Int!) {
    achievements(sessionId: $sessionId)
  }
`;

interface FunFeaturesProps {
  selectedSession?: number | null;
}

export default function FunFeatures({ selectedSession }: FunFeaturesProps) {
  const [currentFactIndex, setCurrentFactIndex] = useState(0);

  const { data: globalStatsData } = useQuery(GET_GLOBAL_STATS);
  const { data: funFactsData } = useQuery(GET_FUN_FACTS);
  const { data: sessionStatsData } = useQuery(GET_SESSION_STATS, {
    variables: { sessionId: selectedSession },
    skip: !selectedSession,
  });
  const { data: achievementsData } = useQuery(GET_ACHIEVEMENTS, {
    variables: { sessionId: selectedSession },
    skip: !selectedSession,
  });

  const globalStats = globalStatsData?.globalStats
    ? JSON.parse(globalStatsData.globalStats)
    : null;
  const funFacts = funFactsData?.funFacts
    ? JSON.parse(funFactsData.funFacts)
    : [];
  const sessionStats = sessionStatsData?.sessionStats
    ? JSON.parse(sessionStatsData.sessionStats)
    : null;
  const achievements = achievementsData?.achievements
    ? JSON.parse(achievementsData.achievements)
    : [];

  // Rotate through fun facts
  useEffect(() => {
    if (funFacts.length > 0) {
      const interval = setInterval(() => {
        setCurrentFactIndex((prev) => (prev + 1) % funFacts.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [funFacts.length]);

  return (
    <div className="space-y-6">
      {/* Global Statistics */}
      {globalStats && (
        <Card className="border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-slate-700">
              <BarChart3 className="h-6 w-6" />
              <span>Global Learning Statistics</span>
            </CardTitle>
            <CardDescription className="text-lg">
              See how the entire community is learning with Angluin's method!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border border-slate-200">
                <div className="text-3xl font-bold text-slate-700">
                  {globalStats.totalSessions}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>Sessions</span>
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">
                  {globalStats.totalExamples}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center space-x-1">
                  <Target className="h-4 w-4" />
                  <span>Examples</span>
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-600">
                  {globalStats.totalHypotheses}
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center space-x-1">
                  <Brain className="h-4 w-4" />
                  <span>Hypotheses</span>
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-amber-200">
                <div className="text-3xl font-bold text-amber-600">
                  {(globalStats.averageConfidence * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground flex items-center justify-center space-x-1">
                  <Star className="h-4 w-4" />
                  <span>Avg Confidence</span>
                </div>
              </div>
            </div>

            {globalStats.topPerformingSession && (
              <div className="mt-6 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Trophy className="h-5 w-5 text-amber-600" />
                  <span className="font-semibold text-amber-800">
                    Top Performing Session
                  </span>
                </div>
                <p className="text-sm text-amber-700">
                  <strong>{globalStats.topPerformingSession.name}</strong> with{" "}
                  {(globalStats.topPerformingSession.confidence * 100).toFixed(
                    1
                  )}
                  % average confidence (
                  {globalStats.topPerformingSession.hypothesisCount} hypotheses)
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Session Statistics */}
      {selectedSession && sessionStats && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-slate-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-700">
              <Activity className="h-6 w-6" />
              <span>Your Session Statistics</span>
            </CardTitle>
            <CardDescription className="text-lg">
              Track your learning progress and achievements!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-600">
                  {sessionStats.totalExamples}
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Examples
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {sessionStats.positiveExamples} positive,{" "}
                  {sessionStats.negativeExamples} negative
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-600">
                  {sessionStats.totalHypotheses}
                </div>
                <div className="text-sm text-muted-foreground">
                  Hypotheses Generated
                </div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border border-slate-200">
                <div className="text-2xl font-bold text-slate-700">
                  {(sessionStats.bestHypothesis * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">
                  Best Confidence
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">
                    Average Confidence
                  </span>
                </div>
                <div className="text-lg font-bold text-green-600">
                  {(sessionStats.averageConfidence * 100).toFixed(1)}%
                </div>
              </div>
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="flex items-center space-x-2 mb-2">
                  <Zap className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Session Age</span>
                </div>
                <div className="text-lg font-bold text-blue-600">
                  {sessionStats.sessionAge} day
                  {sessionStats.sessionAge !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      {selectedSession && achievements.length > 0 && (
        <Card className="border-2 border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-amber-700">
              <Award className="h-6 w-6" />
              <span>Your Achievements</span>
            </CardTitle>
            <CardDescription className="text-lg">
              Celebrate your learning milestones!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement: any) => (
                <div
                  key={achievement.id}
                  className="p-4 bg-white rounded-lg border border-amber-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-3xl">{achievement.emoji}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-800">
                        {achievement.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {achievement.description}
                      </p>
                      {achievement.progress < 1 && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                              style={{
                                width: `${achievement.progress * 100}%`,
                              }}
                            ></div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {Math.round(achievement.progress * 100)}% complete
                          </span>
                        </div>
                      )}
                    </div>
                    {achievement.unlocked && <div className="text-2xl">🎉</div>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fun Facts */}
      {/*funFacts.length > 0 && (
        <Card className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-700">
              <Lightbulb className="h-6 w-6" />
              <span>Did You Know?</span>
            </CardTitle>
            <CardDescription className="text-lg">
              Learn interesting facts about Angluin's method and schema mapping!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-6 bg-white rounded-lg border border-green-200">
              <div className="flex items-start space-x-4">
                <div className="text-4xl">
                  {funFacts[currentFactIndex]?.emoji}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-medium text-green-800">
                    {funFacts[currentFactIndex]?.fact}
                  </p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge
                      variant="outline"
                      className="bg-green-100 text-green-800"
                    >
                      {funFacts[currentFactIndex]?.category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {currentFactIndex + 1} of {funFacts.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-center space-x-2 mt-4">
                {funFacts.map((_: any, index: number) => (
                  <div
                    key={index}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentFactIndex
                        ? "bg-green-600"
                        : "bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}*/}

      {/* Learning Tips */}
      <Card className="border-2 border-slate-200 bg-gradient-to-r from-slate-50 to-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-slate-700">
            <Brain className="h-6 w-6" />
            <span>Pro Tips for Better Learning</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-2xl">🎯</div>
              <div>
                <h4 className="font-semibold text-slate-800">Start Simple</h4>
                <p className="text-sm text-muted-foreground">
                  Begin with clear, simple examples before adding complexity
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-2xl">⚠️</div>
              <div>
                <h4 className="font-semibold text-slate-800">
                  Add Counterexamples
                </h4>
                <p className="text-sm text-muted-foreground">
                  Include negative examples to help the AI understand boundaries
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-2xl">🔄</div>
              <div>
                <h4 className="font-semibold text-slate-800">
                  Iterate and Refine
                </h4>
                <p className="text-sm text-muted-foreground">
                  Test hypotheses and add more examples to improve accuracy
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 p-3 bg-white rounded-lg border border-slate-200">
              <div className="text-2xl">📊</div>
              <div>
                <h4 className="font-semibold text-slate-800">
                  Monitor Confidence
                </h4>
                <p className="text-sm text-muted-foreground">
                  Higher confidence scores indicate better learning progress
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
