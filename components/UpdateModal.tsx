import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { checkForAppUpdate, openUpdateLink, VersionCheckResult } from '@/lib/updateService';

interface UpdateModalProps {
  /** Si es true, permite cerrar la alerta temporalmente. Si es false, es obligatoria. */
  dismissable?: boolean;
}

export function UpdateModal({ dismissable = true }: UpdateModalProps) {
  const [updateInfo, setUpdateInfo] = useState<VersionCheckResult | null>(null);
  const [visible, setVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    
    async function check() {
      const result = await checkForAppUpdate();
      if (isMounted && result && result.hasUpdate) {
        setUpdateInfo(result);
        setVisible(true);
      }
    }

    check();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpdate = async () => {
    if (!updateInfo) return;
    setLoading(true);
    try {
      await openUpdateLink(updateInfo);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!visible || !updateInfo) {
    return null;
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={() => {
        if (dismissable) setVisible(false);
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <FontAwesome name="cloud-download" size={38} color="#0D9488" />
          </View>

          <Text style={styles.title}>¡Nueva versión disponible!</Text>
          <Text style={styles.subtitle}>
            Una nueva versión (<Text style={styles.boldText}>{updateInfo.latestVersion}</Text>) de Liwa está lista para actualizar.
          </Text>

          <View style={styles.versionBadgeContainer}>
            <Text style={styles.versionBadgeText}>
              Versión actual: {updateInfo.currentVersion} → Nueva: {updateInfo.latestVersion}
            </Text>
          </View>

          {updateInfo.releaseNotes ? (
            <ScrollView style={styles.notesScroll} nestedScrollEnabled>
              <Text style={styles.notesTitle}>Novedades:</Text>
              <Text style={styles.notesText}>{updateInfo.releaseNotes.trim()}</Text>
            </ScrollView>
          ) : null}

          <TouchableOpacity
            style={styles.updateButton}
            onPress={handleUpdate}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <FontAwesome name="download" size={16} color="#FFFFFF" style={styles.buttonIcon} />
                <Text style={styles.updateButtonText}>Actualizar App ahora</Text>
              </>
            )}
          </TouchableOpacity>

          {dismissable && (
            <TouchableOpacity style={styles.dismissButton} onPress={handleDismiss}>
              <Text style={styles.dismissButtonText}>Más tarde</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#0D9488',
  },
  versionBadgeContainer: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  versionBadgeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  notesScroll: {
    maxHeight: 100,
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 16,
  },
  updateButton: {
    width: '100%',
    backgroundColor: '#0D9488',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  buttonIcon: {
    marginRight: 8,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dismissButton: {
    marginTop: 12,
    paddingVertical: 8,
  },
  dismissButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
});
