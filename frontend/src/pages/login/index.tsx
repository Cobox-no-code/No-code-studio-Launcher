// pages/login.tsx
'use client'
import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertCircle, ArrowRight, Check, ChevronLeft, Lock, Mail, Phone, User } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { backend_url } from '@/backend.config'

const LoginPage = () => {
  const router = useRouter()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // User info
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  
  // OTP related
  const [otp, setOtp] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [timer, setTimer] = useState(0)

  // Handle sending OTP
  const sendOtp = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number')
      return
    }
    
    try {
      setLoading(true)
      setError('')
      
      const res = await axios.post(`${backend_url}/send-otp/`, { 
        phone,
        email,
        name 
      })
      
      setSessionId(res.data.session_id)
      setStep('otp')
      
      // Start countdown timer for 60 seconds
      setTimer(60)
      const countdown = setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer <= 1) {
            clearInterval(countdown)
            return 0
          }
          return prevTimer - 1
        })
      }, 1000)
      
      toast.success('OTP sent successfully!')
    } catch (err) {
      console.error('Error sending OTP:', err)
      setError('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle OTP verification
  const verifyOtp = async (e: FormEvent) => {
    e.preventDefault()
    
    if (!otp || otp.length < 4) {
      setError('Please enter a valid OTP')
      return
    }
    
    try {
      setLoading(true)
      setError('')
      
      const res = await axios.post(`${backend_url}/verify-otp/`, {
        session_id: sessionId,
        otp,
        phone,
        name,
        email
      })

      // Save user info in localStorage
      localStorage.setItem('customer_id', res.data.customer_id)
      localStorage.setItem('phone', res.data.phone)
      localStorage.setItem('name', res.data.name || '')
      localStorage.setItem('email', res.data.email || '')

      toast.success('Login successful!')
      router.push('/')
    } catch (err) {
      console.error('Error verifying OTP:', err)
      setError('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle resending OTP
  const resendOtp = async () => {
    if (timer > 0) return
    
    try {
      setLoading(true)
      
      const res = await axios.post(`${backend_url}/send-otp/`, { phone })
      setSessionId(res.data.session_id)
      
      // Reset timer
      setTimer(60)
      const countdown = setInterval(() => {
        setTimer(prevTimer => {
          if (prevTimer <= 1) {
            clearInterval(countdown)
            return 0
          }
          return prevTimer - 1
        })
      }, 1000)
      
      toast.success('OTP resent successfully!')
    } catch (err) {
      console.error('Error resending OTP:', err)
      setError('Failed to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none"></div>
      
      <div className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 max-w-6xl mx-auto">
          {/* Left side - Logo and description */}
          <div className="w-full md:w-2/5 text-white space-y-6 mb-8 md:mb-0">
            <div className="flex items-center mb-4">
              <div className="w-16 h-16 mr-4 relative">
                <img
                  src="http://34.228.195.218/static/images/logo.png"
                  alt="Logo"
                  width={64}
                  height={64}
                  className="rounded-lg shadow-lg"
                />
              </div>
              <h1 className="text-4xl font-bold">PaperBill</h1>
            </div>
            
            <p className="text-xl text-gray-300 leading-relaxed">
              Sign in to access your account
            </p>
            
            <div className="space-y-4 mt-8">
              <div className="flex items-start">
                <div className="bg-white/10 p-2 rounded-full mr-4">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Secure Login</h3>
                  <p className="text-gray-400">Authenticate with OTP for enhanced security</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-white/10 p-2 rounded-full mr-4">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Easy Access</h3>
                  <p className="text-gray-400">Quick login with your phone number</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="bg-white/10 p-2 rounded-full mr-4">
                  <Check className="h-6 w-6 text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium">Stay Connected</h3>
                  <p className="text-gray-400">Access all features seamlessly</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right side - Form */}
          <div className="w-full md:w-3/5 max-w-md">
            <Card className="shadow-2xl border-0 bg-white">
              <CardHeader>
                <CardTitle className="text-2xl font-bold">
                  {step === 'phone' ? 'Login to Your Account' : 'Verify OTP'}
                </CardTitle>
                <CardDescription>
                  {step === 'phone' 
                    ? 'Enter your details to proceed' 
                    : 'Enter the OTP sent to your phone'}
                </CardDescription>
              </CardHeader>
              
              {error && (
                <CardContent className="pt-0 pb-2">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </CardContent>
              )}
              
              <CardContent>
                {step === 'phone' ? (
                  <form onSubmit={sendOtp} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-500" />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        placeholder="Enter your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        Email Address
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        placeholder="Enter your phone number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending OTP...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          Continue <ArrowRight className="ml-2 h-4 w-4" />
                        </span>
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={verifyOtp} className="space-y-4">
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">We&lsquo;ve sent a verification code to</p>
                      <div className="flex items-center font-medium text-gray-700">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        {phone}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="otp" className="flex items-center">
                        <Lock className="h-4 w-4 mr-2 text-gray-500" />
                        Enter OTP
                      </Label>
                      <Input
                        id="otp"
                        placeholder="Enter verification code"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="text-center text-xl tracking-widest font-medium"
                        maxLength={6}
                        required
                      />
                    </div>
                    
                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Verifying...
                        </span>
                      ) : (
                        "Verify OTP"
                      )}
                    </Button>
                    
                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="button"
                        onClick={() => setStep('phone')}
                        className="text-sm flex items-center text-gray-600 hover:text-gray-900"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Change Number
                      </button>
                      
                      <button
                        type="button"
                        onClick={resendOtp}
                        disabled={timer > 0}
                        className={`text-sm ${timer > 0 ? 'text-gray-400' : 'text-blue-600 hover:text-blue-800'}`}
                      >
                        {timer > 0 ? `Resend in ${timer}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginPage