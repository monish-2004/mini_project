import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, LineChart, Brain, Zap } from 'lucide-react';
import Button from '../components/ui/Button';

const HomePage: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="pt-16 pb-20 sm:pt-24 sm:pb-32 lg:pt-32 lg:pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1>
                <span className="block text-sm font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                  Introducing GLARE
                </span>
                <span className="mt-1 block text-4xl tracking-tight font-extrabold sm:text-5xl xl:text-6xl">
                  <span className="block text-gray-900 dark:text-white">Learning Optimized by</span>
                  <span className="block text-blue-600 dark:text-blue-400">Emotion Intelligence</span>
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-500 dark:text-gray-300 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Our adaptive learning platform uses emotion tracking to personalize your educational experience,
                helping you stay engaged, overcome confusion, and maximize your study effectiveness.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                {user ? (
                  <div className="space-y-4">
                    <Link to="/dashboard">
                      <Button variant="primary\" size="lg\" fullWidth>
                        Go to Your Dashboard
                      </Button>
                    </Link>
                    <Link to="/reading">
                      <Button variant="outline" size="lg" fullWidth>
                        Start New Reading Session
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Link to="/signup">
                      <Button variant="primary" size="lg" fullWidth>
                        Sign up
                      </Button>
                    </Link>
                    <Link to="/login">
                      <Button variant="outline" size="lg" fullWidth>
                        Log in
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="relative block w-full bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
                  <img
                    className="w-full"
                    src="https://images.pexels.com/photos/5428003/pexels-photo-5428003.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
                    alt="Student studying with adaptive learning system"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold tracking-wide text-blue-600 dark:text-blue-400 uppercase">Features</h2>
            <p className="mt-1 text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl sm:tracking-tight">
              How GLARE Enhances Your Learning
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500 dark:text-gray-300">
              Our platform adapts to your emotional state to provide the best learning experience possible.
            </p>
          </div>
          
          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="pt-6">
                <div className="flow-root bg-gray-50 dark:bg-gray-900 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-500 dark:bg-blue-600 rounded-md shadow-lg">
                        <BookOpen className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">
                      Adaptive Content
                    </h3>
                    <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                      Our platform adjusts learning materials based on your emotional state, keeping you engaged and challenged at the right level.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-6">
                <div className="flow-root bg-gray-50 dark:bg-gray-900 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-purple-500 dark:bg-purple-600 rounded-md shadow-lg">
                        <Brain className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">
                      Emotion Intelligence
                    </h3>
                    <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                      Our system detects boredom, confusion, fatigue, and focus to provide timely interventions that maximize learning efficiency.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-6">
                <div className="flow-root bg-gray-50 dark:bg-gray-900 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-green-500 dark:bg-green-600 rounded-md shadow-lg">
                        <LineChart className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">
                      Performance Analytics
                    </h3>
                    <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                      Track your learning patterns, identify peak productivity times, and understand your emotional responses to different subjects.
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-6">
                <div className="flow-root bg-gray-50 dark:bg-gray-900 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-orange-500 dark:bg-orange-600 rounded-md shadow-lg">
                        <Zap className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 dark:text-white tracking-tight">
                      Instant Assistance
                    </h3>
                    <p className="mt-5 text-base text-gray-500 dark:text-gray-400">
                      Get help exactly when you need it with our intelligent assistant that responds to confusion with relevant explanations.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;