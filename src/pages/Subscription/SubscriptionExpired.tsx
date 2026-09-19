import { Box, Card, CardContent, Typography, Button } from '@mui/material'
import { FontAwesomeIcon } from '../../lib/icons'
import { faClock } from '@fortawesome/free-solid-svg-icons'
import { useAuth } from '../../contexts/AuthContext'
import { ECOLIO_NAVY } from '../../theme'
import SubscriptionPanel from '../../components/Subscription/SubscriptionPanel'

export default function SubscriptionExpired() {
  const { user, logout } = useAuth()
  const canPay = user?.role === 'director' || user?.role === 'super_admin'

  return (
    <Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh" bgcolor="#F4F6F8" p={2}>
      <Card sx={{ maxWidth: 520, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <FontAwesomeIcon icon={faClock} style={{ fontSize: '1.4rem', color: '#b45309' }} />
          </Box>
          <Typography variant="h6" fontWeight={700} color={ECOLIO_NAVY} mb={1}>
            Période d'essai terminée
          </Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            {canPay
              ? "Votre période d'essai gratuite de 30 jours est arrivée à son terme. Pour continuer à utiliser Écolio, réglez l'abonnement par Wave puis envoyez une capture d'écran du paiement pour vérification."
              : "L'abonnement de votre école n'est plus actif. Merci de contacter votre directeur ou administrateur pour régulariser la situation."}
          </Typography>

          <SubscriptionPanel />

          <Button fullWidth variant="text" onClick={logout} sx={{ mt: 3 }}>Se déconnecter</Button>
        </CardContent>
      </Card>
    </Box>
  )
}
